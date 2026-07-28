# المرحلة الأولى: بناء المشروع (Build Stage)
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# استقبال متغير البيئة كـ Build-time Argument لربطه مع كود الجافاسكريبت المترجم
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# المرحلة الثانية: التشغيل والتقديم عبر Nginx (Production Stage)
FROM nginx:1.25-alpine

# نسخ إعدادات Nginx المخصصة لتدعم التوجيه الداخلي لـ Vue Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# نسخ ملفات المشروع المبنية من المرحلة الأولى
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
