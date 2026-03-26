const SMALL_SCREEN_BREAKPOINT_PX = 1024;

const MOBILE_USER_AGENT_RE =
  /Android.+Mobile|iPhone|iPod|BlackBerry|BB10|IEMobile|Opera Mini|Windows Phone|webOS|Mobile Safari/i;
const TABLET_USER_AGENT_RE = /iPad|Tablet|Kindle|Silk|PlayBook|Android(?!.*Mobile)/i;

export function shouldBlockSmallScreenRequest(requestHeaders: Headers) {
  const viewportWidthHeader = requestHeaders.get("viewport-width");
  const viewportWidth = viewportWidthHeader ? Number(viewportWidthHeader) : Number.NaN;

  if (Number.isFinite(viewportWidth) && viewportWidth > 0) {
    return viewportWidth < SMALL_SCREEN_BREAKPOINT_PX;
  }

  if (requestHeaders.get("sec-ch-ua-mobile") === "?1") {
    return true;
  }

  const userAgent = requestHeaders.get("user-agent") ?? "";
  return MOBILE_USER_AGENT_RE.test(userAgent) || TABLET_USER_AGENT_RE.test(userAgent);
}
