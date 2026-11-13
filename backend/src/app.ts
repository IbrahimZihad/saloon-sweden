import 'reflect-metadata';
import { BadRequestException, ForbiddenException, HttpException, UnauthorizedException } from './common/http-exceptions';
import cookieParser from 'cookie-parser';
import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, validate } from 'class-validator';
import express, { ErrorRequestHandler, Express, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import cron from 'node-cron';
import swaggerUi from 'swagger-ui-express';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';
import { AppointmentFilterDto, BookAppointmentDto, CancelAppointmentDto, CreateAdminAppointmentDto, RescheduleAppointmentDto, UpdateStatusDto } from './appointments/dto/appointment.dto';
import { AppointmentsService } from './appointments/appointments.service';
import { AvailabilityService } from './availability/availability.service';
import { AvailabilityQueryDto, AvailabilitySlotsQueryDto } from './availability/dto/availability-query.dto';
import { BusinessHoursService, SetBusinessHoursDto } from './business-hours/business-hours.service';
import { CategoriesService } from './categories/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories/dto/category.dto';
import { ContentService, CreateContactMessageDto, TestimonialDto } from './content/content.service';
import { CustomersService } from './customers/customers.service';
import { DashboardService } from './dashboard/dashboard.service';
import { validateEnv } from './config/env.validation';
import { DatabaseService } from './database/database.service';
import { createSequelize } from './database/sequelize.config';
import { AuthService } from './auth/auth.service';
import { AUTH_COOKIE } from './auth/auth.constants';
import { AuthUser } from './auth/auth.types';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto } from './auth/dto/auth.dto';
import { MailService } from './notifications/mail.service';
import { NotificationsService } from './notifications/notifications.service';
import { ServicesService } from './services/services.service';
import { CreateServiceDto, UpdateServiceDto } from './services/dto/service.dto';
import { SettingsService } from './settings/settings.service';
import { UpdateSettingsDto } from './settings/dto/update-settings.dto';
import { StaffService } from './staff/staff.service';
import { CreateStaffDto, CreateTimeOffDto, SetBreaksDto, SetWorkingHoursDto, UpdateStaffDto } from './staff/dto/staff.dto';
import { UploadsService } from './uploads/uploads.service';
import { UsersService, CreateUserDto, UpdateUserDto } from './users/users.service';
import { RoleValue } from './database/enums';
import { serializeDecimals } from './common/utils/serialize.util';
import { RuntimeConfig } from './common/runtime-config';
import { JwtTokenService } from './common/jwt-token.service';

type AuthenticatedRequest = Request & { user?: AuthUser };
type DtoConstructor<T> = new () => T;

class CustomerQueryDto {
  @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @Type(() => Number) @IsInt() @Min(1) @Max(200)
  limit = 20;

  @IsOptional() @IsString() @MaxLength(190)
  search?: string;
}

class PageQueryDto {
  @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 20;
}

interface RouteOptions {
  roles?: RoleValue[];
  queryDto?: DtoConstructor<object>;
  statusCode?: number;
  limit?: number;
  upload?: RequestHandler;
}

function asyncHandler(handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    void handler(req as AuthenticatedRequest, res).catch(next);
  };
}

function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? '' : value;
}

async function validateDto<T extends object>(
  dtoType: DtoConstructor<T>,
  value: unknown,
): Promise<T> {
  const dto = plainToInstance(dtoType, value);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    throw new BadRequestException(errors.flatMap((error) => Object.values(error.constraints ?? {})));
  }
  return dto;
}

function errorMiddleware(): ErrorRequestHandler {
  return (exception: unknown, _req, res, _next) => {
    let status = 500;
    let error = 'InternalServerError';
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const response = body as Record<string, unknown>;
        message = (response.message as string | string[]) ?? exception.message;
        error = (response.error as string) ?? exception.name;
      }
    } else if (exception instanceof UniqueConstraintError) {
      status = 409;
      error = 'Conflict';
      message = 'A record with these unique values already exists';
    } else if (exception instanceof ForeignKeyConstraintError) {
      status = 400;
      error = 'BadRequest';
      message = 'Related record does not exist or is still referenced';
    } else if (exception instanceof ValidationError) {
      status = 400;
      error = 'BadRequest';
      message = exception.errors.map((item) => item.message);
    } else if (exception instanceof multer.MulterError) {
      status = exception.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      error = 'BadRequest';
      message = exception.message;
    } else {
      // eslint-disable-next-line no-console
      console.error(exception instanceof Error ? exception.stack ?? exception.message : exception);
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
    });
  };
}

export async function createApp(): Promise<Express> {
  const env = validateEnv(process.env);
  const config = new RuntimeConfig(env);
  const jwt = new JwtTokenService({
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const database = new DatabaseService(createSequelize());
  await database.connect();

  const settings = new SettingsService();
  const mail = new MailService(config);
  const notifications = new NotificationsService(mail, settings);
  const availability = new AvailabilityService(settings);
  const appointments = new AppointmentsService(database, settings, availability, notifications);
  const auth = new AuthService(jwt, config, mail);
  const categories = new CategoriesService();
  const services = new ServicesService();
  const staff = new StaffService(database);
  const hours = new BusinessHoursService(database);
  const customers = new CustomersService(database);
  const dashboard = new DashboardService(settings);
  const content = new ContentService();
  const uploads = new UploadsService(config);
  const users = new UsersService();

  const app = express();
  const router = express.Router();
  const apiPaths: Record<string, Record<string, unknown>> = {};
  const frontendUrl = env.FRONTEND_URL;

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin === frontendUrl) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (req) => env.NODE_ENV === 'test' || req.path === '/api/health',
  }));
  app.use('/uploads', express.static(uploads.uploadDir));

  const authenticate: RequestHandler = (req, _res, next) => {
    void (async () => {
      const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
      const header = req.headers.authorization;
      const token = cookieToken ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
      if (!token) throw new UnauthorizedException('Authentication required');

      let payload: { sub: string };
      try {
        payload = await jwt.verifyAsync<{ sub: string }>(token, { secret: env.JWT_SECRET });
      } catch {
        throw new UnauthorizedException('Invalid or expired session');
      }
      (req as AuthenticatedRequest).user = await auth.me(payload.sub);
    })().then(() => next(), next);
  };

  const roleGuard = (roles: RoleValue[]): RequestHandler => (req, _res, next) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      next(new ForbiddenException('Insufficient permissions'));
      return;
    }
    next();
  };

  const register = (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>,
    options: RouteOptions = {},
  ) => {
    const middleware: RequestHandler[] = [];
    if (options.limit) {
      middleware.push(rateLimit({
        windowMs: 60_000,
        limit: options.limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        skip: () => env.NODE_ENV === 'test',
      }));
    }
    if (options.roles) middleware.push(authenticate, roleGuard(options.roles));
    if (options.upload) middleware.push(options.upload);
    const wrapped = asyncHandler(async (req, res) => {
      if (options.queryDto) req.query = await validateDto(options.queryDto, req.query) as Request['query'];
      const result = await handler(req, res);
      if (!res.headersSent) {
        const defaultStatus = method === 'post' ? 201 : 200;
        res.status(options.statusCode ?? defaultStatus).json(serializeDecimals(result));
      }
    });
    router[method](path, ...middleware, wrapped);
    const openApiPath = path.replace(/:([^/]+)/g, '{$1}');
    apiPaths[openApiPath] ??= {};
    apiPaths[openApiPath][method] = {
      tags: [path.split('/')[1] ?? 'api'],
      summary: `${method.toUpperCase()} ${path}`,
      ...(options.roles ? { security: [{ bearerAuth: [] }, { cookieAuth: [] }] } : {}),
      responses: {
        [options.statusCode ?? (method === 'post' ? 201 : 200)]: { description: 'Successful response' },
        ...(options.roles ? { 401: { description: 'Authentication required' }, 403: { description: 'Insufficient permissions' } } : {}),
      },
    };
  };

  const admin = ['ADMIN'] as RoleValue[];
  const adminAndStaff = ['ADMIN', 'STAFF'] as RoleValue[];
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single('file');

  register('get', '/health', async () => {
    await database.ping();
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  });
  register('post', '/auth/login', async (req, res) => {
    const result = await auth.login(await validateDto(LoginDto, req.body));
    res.cookie(AUTH_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { user: result.user };
  }, { statusCode: 200, limit: 5 });
  register('post', '/auth/logout', async (_req, res) => {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    return { message: 'Logged out' };
  }, { statusCode: 200 });
  register('get', '/auth/me', async (req) => req.user!, { roles: adminAndStaff });
  register('post', '/auth/change-password', async (req) => {
    await auth.changePassword(req.user!.id, await validateDto(ChangePasswordDto, req.body));
    return { message: 'Password updated' };
  }, { statusCode: 200, roles: adminAndStaff });
  register('post', '/auth/forgot-password', async (req) => auth.forgotPassword(
    (await validateDto(ForgotPasswordDto, req.body)).email,
  ), { statusCode: 200, limit: 3 });
  register('post', '/auth/reset-password', async (req) => {
    await auth.resetPassword(await validateDto(ResetPasswordDto, req.body));
    return { message: 'Password has been reset' };
  }, { statusCode: 200, limit: 5 });

  register('post', '/public/appointments', async (req) => appointments.bookPublic(
    await validateDto(BookAppointmentDto, req.body),
  ), { limit: 10 });
  register('get', '/public/appointments/reference/:reference', async (req) =>
    appointments.findByReference(routeParam(req, 'reference'), req.query.email as string | undefined), { limit: 20 });
  register('get', '/admin/appointments', async (req) =>
    appointments.findAll(await validateDto(AppointmentFilterDto, req.query)), { roles: adminAndStaff });
  // Must be registered before `/admin/appointments/:id`, otherwise Express
  // matches "notifications" as an appointment id.
  register('get', '/admin/appointments/notifications', async (req) => {
    const sinceParam = req.query.since;
    const since = typeof sinceParam === 'string' ? new Date(sinceParam) : new Date();
    if (Number.isNaN(since.getTime())) {
      throw new BadRequestException('since must be an ISO timestamp');
    }
    // Captured before the query so anything created while it runs is picked up
    // on the next poll instead of being skipped.
    const serverTime = new Date();
    const items = await appointments.recentOnlineBookings(since);
    return { items, serverTime };
  }, { roles: adminAndStaff });
  register('get', '/admin/appointments/:id', async (req) => appointments.findOne(routeParam(req, 'id')), { roles: adminAndStaff });
  register('post', '/admin/appointments', async (req) => appointments.createAdmin(
    await validateDto(CreateAdminAppointmentDto, req.body),
  ), { roles: adminAndStaff });
  register('patch', '/admin/appointments/:id/reschedule', async (req) => appointments.reschedule(
    routeParam(req, 'id'),
    await validateDto(RescheduleAppointmentDto, req.body),
  ), { roles: adminAndStaff });
  register('patch', '/admin/appointments/:id/status', async (req) => appointments.updateStatus(
    routeParam(req, 'id'),
    await validateDto(UpdateStatusDto, req.body),
  ), { roles: adminAndStaff });
  register('post', '/admin/appointments/:id/cancel', async (req) => appointments.cancel(
    routeParam(req, 'id'),
    (await validateDto(CancelAppointmentDto, req.body)).reason,
  ), { roles: adminAndStaff });

  register('get', '/public/availability/dates', async (req) =>
    availability.getAvailableDates(
      (await validateDto(AvailabilityQueryDto, req.query)).serviceIds,
      (req.query.staffId as string | undefined),
    ), { limit: 60 });
  register('get', '/public/availability/slots', async (req) => {
    const query = await validateDto(AvailabilitySlotsQueryDto, req.query);
    return availability.getSlots(query.serviceIds, query.date, query.staffId);
  }, { limit: 60 });

  register('get', '/public/categories', () => categories.findPublic());
  register('get', '/admin/categories', () => categories.findAll(), { roles: admin });
  register('post', '/admin/categories', async (req) => categories.create(
    await validateDto(CreateCategoryDto, req.body),
  ), { roles: admin });
  register('put', '/admin/categories/:id', async (req) => categories.update(
    routeParam(req, 'id'),
    await validateDto(UpdateCategoryDto, req.body),
  ), { roles: admin });
  register('delete', '/admin/categories/:id', async (req) => {
    await categories.remove(routeParam(req, 'id'));
    return { message: 'Category deleted' };
  }, { roles: admin });

  register('get', '/public/services', (req) => services.findPublic(req.query.category as string | undefined));
  register('get', '/public/services/:id', (req) => services.findOne(routeParam(req, 'id')));
  register('get', '/admin/services', () => services.findAll(), { roles: adminAndStaff });
  register('post', '/admin/services', async (req) => services.create(
    await validateDto(CreateServiceDto, req.body),
  ), { roles: admin });
  register('put', '/admin/services/:id', async (req) => services.update(
    routeParam(req, 'id'),
    await validateDto(UpdateServiceDto, req.body),
  ), { roles: admin });
  register('delete', '/admin/services/:id', async (req) => {
    await services.remove(routeParam(req, 'id'));
    return { message: 'Service deleted' };
  }, { roles: admin });

  register('get', '/public/staff', () => staff.findPublic());
  register('get', '/admin/staff', () => staff.findAll(), { roles: adminAndStaff });
  register('get', '/admin/staff/:id', (req) => staff.findOne(routeParam(req, 'id')), { roles: adminAndStaff });
  register('post', '/admin/staff', async (req) => staff.create(await validateDto(CreateStaffDto, req.body)), { roles: admin });
  register('put', '/admin/staff/:id', async (req) => staff.update(
    routeParam(req, 'id'),
    await validateDto(UpdateStaffDto, req.body),
  ), { roles: admin });
  register('delete', '/admin/staff/:id', async (req) => {
    await staff.deactivate(routeParam(req, 'id'));
    return { message: 'Staff member deactivated' };
  }, { roles: admin });
  register('put', '/admin/staff/:id/working-hours', async (req) => staff.setWorkingHours(
    routeParam(req, 'id'),
    await validateDto(SetWorkingHoursDto, req.body),
  ), { roles: admin });
  register('put', '/admin/staff/:id/breaks', async (req) => staff.setBreaks(
    routeParam(req, 'id'),
    await validateDto(SetBreaksDto, req.body),
  ), { roles: admin });
  register('post', '/admin/staff/:id/time-off', async (req) => staff.addTimeOff(
    routeParam(req, 'id'),
    await validateDto(CreateTimeOffDto, req.body),
  ), { roles: admin });
  register('delete', '/admin/staff/:id/time-off/:timeOffId', async (req) => {
    await staff.removeTimeOff(routeParam(req, 'id'), routeParam(req, 'timeOffId'));
    return { message: 'Time off removed' };
  }, { roles: admin });

  register('get', '/public/business-hours', () => hours.findAll());
  register('get', '/admin/business-hours', () => hours.findAll(), { roles: admin });
  register('put', '/admin/business-hours', async (req) => hours.replace(
    await validateDto(SetBusinessHoursDto, req.body),
  ), { roles: admin });
  register('get', '/public/settings', () => settings.getPublicSettings());
  register('get', '/admin/settings', () => settings.getSettings(), { roles: admin });
  register('put', '/admin/settings', async (req) => settings.updateSettings(
    await validateDto(UpdateSettingsDto, req.body),
  ), { roles: admin });

  register('get', '/admin/customers', async (req) => {
    const query = await validateDto(CustomerQueryDto, req.query);
    return customers.findAll(query.page, query.limit, query.search);
  }, { roles: adminAndStaff });
  register('get', '/admin/customers/:id', (req) => customers.findOne(routeParam(req, 'id')), { roles: adminAndStaff });
  register('get', '/admin/customers/:id/export', (req) => customers.exportData(routeParam(req, 'id')), { roles: admin });
  register('delete', '/admin/customers/:id', (req) => customers.erase(routeParam(req, 'id')), { roles: admin });
  register('get', '/admin/dashboard/overview', () => dashboard.overview(), { roles: adminAndStaff });

  register('get', '/public/testimonials', () => content.findTestimonials());
  register('post', '/public/contact', async (req) => content.createContactMessage(
    await validateDto(CreateContactMessageDto, req.body),
  ), { limit: 5 });
  register('get', '/admin/testimonials', () => content.findAllTestimonials(), { roles: admin });
  register('post', '/admin/testimonials', async (req) => content.createTestimonial(
    await validateDto(TestimonialDto, req.body),
  ), { roles: admin });
  register('put', '/admin/testimonials/:id', async (req) => content.updateTestimonial(
    routeParam(req, 'id'),
    await validateDto(TestimonialDto, req.body),
  ), { roles: admin });
  register('delete', '/admin/testimonials/:id', async (req) => {
    await content.removeTestimonial(routeParam(req, 'id'));
    return { message: 'Testimonial deleted' };
  }, { roles: admin });
  register('get', '/admin/contact-messages', async (req) => {
    const query = await validateDto(PageQueryDto, req.query);
    return content.findContactMessages(query.page, query.limit);
  }, { roles: adminAndStaff });
  register('patch', '/admin/contact-messages/:id/handle', (req) => content.markContactHandled(routeParam(req, 'id')), { roles: adminAndStaff });

  register('get', '/public/gallery', () => uploads.listGallery());
  register('post', '/admin/uploads', (req) => uploads.saveImage(req.file as Express.Multer.File | undefined), {
    roles: admin,
    upload,
  });
  register('post', '/admin/gallery', async (req) => {
    const saved = await uploads.saveImage(req.file as Express.Multer.File | undefined);
    const metadata = req.body as { altSv?: string; altEn?: string };
    for (const [field, value] of Object.entries(metadata)) {
      if (typeof value !== 'string' || value.length > 255) {
        throw new BadRequestException(`${field} must be a string no longer than 255 characters`);
      }
    }
    return uploads.addGalleryImage(saved.url, metadata.altSv, metadata.altEn);
  }, { roles: admin, upload });
  register('delete', '/admin/gallery/:id', async (req) => {
    await uploads.removeGalleryImage(routeParam(req, 'id'));
    return { message: 'Gallery image removed' };
  }, { roles: admin });

  register('get', '/admin/users', () => users.findAll(), { roles: admin });
  register('post', '/admin/users', async (req) => users.create(
    await validateDto(CreateUserDto, req.body),
  ), { roles: admin });
  register('put', '/admin/users/:id', async (req) => users.update(
    routeParam(req, 'id'),
    await validateDto(UpdateUserDto, req.body),
    req.user!.id,
  ), { roles: admin });

  app.use('/api', router);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup({
    openapi: '3.0.0',
    info: {
      title: 'Salon Booking API',
      description: 'REST API for the Swedish salon website and appointment management system',
      version: '1.0',
    },
    paths: apiPaths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        cookieAuth: { type: 'apiKey', in: 'cookie', name: AUTH_COOKIE },
      },
    },
  }));
  app.use('/api', (_req, res) => res.status(404).json({
    statusCode: 404,
    error: 'NotFound',
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  }));
  app.use(errorMiddleware());
  app.locals.database = database;
  app.locals.notifications = notifications;
  app.locals.notificationTasks = env.NODE_ENV === 'test' ? [] : [
    cron.schedule('*/5 * * * *', () => {
      void notifications.retryPending().catch((error: unknown) => console.error('Notification retry failed:', error));
    }),
    cron.schedule('0 8 * * *', () => {
      void notifications.sendDailyReminders().catch((error: unknown) => console.error('Daily reminders failed:', error));
    }, {
      timezone: 'Europe/Stockholm',
    }),
  ];
  return app;
}
