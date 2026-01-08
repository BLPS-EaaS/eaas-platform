import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';
import { getTranslations, getLocale } from 'next-intl/server';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

function getRelativeTime(date: Date, t: any, locale: string) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t('time.just_now');
  if (diffInSeconds < 3600)
    return t('time.minutes_ago', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400)
    return t('time.hours_ago', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800)
    return t('time.days_ago', { count: Math.floor(diffInSeconds / 86400) });
  return date.toLocaleDateString(locale);
}

function formatAction(action: ActivityType, t: any): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return t('actions.SIGN_UP');
    case ActivityType.SIGN_IN:
      return t('actions.SIGN_IN');
    case ActivityType.SIGN_OUT:
      return t('actions.SIGN_OUT');
    case ActivityType.UPDATE_PASSWORD:
      return t('actions.UPDATE_PASSWORD');
    case ActivityType.DELETE_ACCOUNT:
      return t('actions.DELETE_ACCOUNT');
    case ActivityType.UPDATE_ACCOUNT:
      return t('actions.UPDATE_ACCOUNT');
    case ActivityType.CREATE_TEAM:
      return t('actions.CREATE_TEAM');
    case ActivityType.REMOVE_TEAM_MEMBER:
      return t('actions.REMOVE_TEAM_MEMBER');
    case ActivityType.INVITE_TEAM_MEMBER:
      return t('actions.INVITE_TEAM_MEMBER');
    case ActivityType.ACCEPT_INVITATION:
      return t('actions.ACCEPT_INVITATION');
    default:
      return t('actions.UNKNOWN');
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();
  const t = await getTranslations('ActivityLog');
  const locale = await getLocale();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {t('title')}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('recent')}</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType, t
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` ${t('from_ip')} ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp), t, locale)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('no_activity')}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {t('no_activity_desc')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
