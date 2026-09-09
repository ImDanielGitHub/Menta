export const formatEventDateTime = ({
  value,
  locale,
  timeZone,
  fallback,
}: {
  value: string;
  locale: string;
  timeZone?: string | null;
  fallback: string;
}): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  };
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    const withoutTimeZone = { ...options };
    delete withoutTimeZone.timeZone;
    return new Intl.DateTimeFormat(locale, withoutTimeZone).format(date);
  }
};

export const formatEventShortDateTime = ({
  value,
  locale,
  fallback,
}: {
  value: string;
  locale: string;
  fallback: string;
}): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const formatEventCompletedDate = ({
  value,
  locale,
  timeZone,
  fallback,
}: {
  value: string;
  locale: string;
  timeZone?: string | null;
  fallback: string;
}): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  };
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    const withoutTimeZone = { ...options };
    delete withoutTimeZone.timeZone;
    return new Intl.DateTimeFormat(locale, withoutTimeZone).format(date);
  }
};
