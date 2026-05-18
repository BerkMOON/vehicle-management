export function filterValues(values: any, filterFields: string[]) {
  const filteredValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => !filterFields.includes(key)),
  );
  return filteredValues;
}

export const parseVideoTime = (videoPath: string) => {
  if (!videoPath) return '';
  const baseName = (videoPath.split('/').pop() || '').split('?')[0];

  const withMs = baseName.match(/SOS(\d{8})-(\d{2})(\d{2})(\d{2})-(\d{1,3})/);
  if (withMs) {
    const [, date, hour, minute, second, millisecond] = withMs;
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(
      6,
      8,
    )} ${hour}:${minute}:${second}.${millisecond}`;
  }

  const noMs = baseName.match(/SOS(\d{8})-(\d{2})(\d{2})(\d{2})-(?!\d)/);
  if (noMs) {
    const [, date, hour, minute, second] = noMs;
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(
      6,
      8,
    )} ${hour}:${minute}:${second}`;
  }

  return '';
};
