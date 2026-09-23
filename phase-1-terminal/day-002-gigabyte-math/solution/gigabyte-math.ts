export function estimateVideoMinutes(gigabytes: number, megabytesPerMinute: number): number {
  const totalMegabytes: number = gigabytes * 1024;
  const minutes: number = totalMegabytes / megabytesPerMinute;
  return Math.floor(minutes);
}
