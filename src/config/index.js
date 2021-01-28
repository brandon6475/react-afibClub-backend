import dotenv from 'dotenv';

dotenv.config()

export default {
  app_name: process.env.APP_NAME || 'App',

  env_mode: process.env.ENVIRONMENT,

  hostname: process.env.HOST || 'localhsot',
  port: parseInt(process.env.PORT) || 4000,

  db_host: process.env.DB_HOST,
  db_port: process.env.DB_PORT,
  db_name: process.env.DB_NAME,
  db_user: process.env.DB_USER,
  db_pass: process.env.DB_PASS,
  db_dialect: process.env.DB_DIALECT,
  
  redis_host: process.env.REDIS_HOST,
  redis_port: process.env.REDIS_PORT,
  redis_pass: process.env.REDIS_PASS,

  server_root_url: process.env.SERVER_ROOT_URL || '',
  web_root_url: process.env.WEB_ROOT_URL || '',

  register_code_digit: parseInt(process.env.RIGISTER_CODE_DIGIT) || 8,
  register_link_url: process.env.RIGISTER_LINK_URL || 'signup',

  activation_code_digit: parseInt(process.env.ACTIVATION_CODE_DIGIT) || 6,
  activation_code_expiresin: parseInt(process.env.ACTIVATION_CODE_EXPIRESIN) || 86400,
  activation_link_url: process.env.ACTIVATION_LINK_URL || 'activate',
  reset_password_link_url: process.env.RESET_PASSWORD_LINK_URL || 'resetpassword',

  secret_key: process.env.SECRET_KEY || '',
  token_expiresin: process.env.TOKEN_EXPIRESIN || '30m',
  refresh_token_expiresin: process.env.REFRESH_TOKEN_EXPIRESIN || '12h',

  mail_sender_name: process.env.MAIL_SENDER_NAME || '',
  mail_sender_email: process.env.MAIL_SENDER_EMAIL || '',
  mail_sender_password: process.env.MAIL_SENDER_PASSWORD || '',
  confirm_mail_subject: process.env.CONFIRM_MAIL_SUBJECT || 'PLEASE CONFIRM YOUR EMAIL',
  reset_password_mail_subject: process.env.RESET_PASSWORD_MAIL_SUBJECT || 'RESET PASSWORD',

  company_name: process.env.COMPANY_NAME || '',
  company_address: process.env.COMPANY_ADDRESS || '',
  company_phonenumber: process.env.COMPANY_PHONENUMBER || '',
  company_email: process.env.COMPANY_EMAIL || '',
  
  ios_app_url: process.env.IOS_APP || 'https://www.apple.com/ios/app-store/',
  android_app_url: process.env.ANDROID_APP || 'https://play.google.com/store/apps',
  
  stripe_api_key: process.env.STRIPE_API_KEY || '',
  
  firestore_url: process.env.FIRESTORE_URL || '',
  default_avatar: 'https://clubafib.s3-us-west-1.amazonaws.com/default.png',

  facebook_app_id: process.env.FACEBOOK_APP_ID || '',
  facebook_app_secret: process.env.FACEBOOK_APP_SECRET || '',

  google_client_id: process.env.GOOGLE_CLIENT_ID || '',
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET || '',

  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID || '',
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || '',

  s3_bucket_name: process.env.S3_BUCKET_NAME || ''
}