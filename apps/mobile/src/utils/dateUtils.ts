export const getLocalDateISOString = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

export const getDayOfWeek = (): number => {
    return new Date().getDay();
};
