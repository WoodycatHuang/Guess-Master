function parseQueryValue(raw: unknown): Record<string, string> | undefined {
  if (!raw) return undefined;

  if (typeof raw === 'string') {
    const out: Record<string, string> = {};
    for (const part of raw.split('&')) {
      if (!part) continue;
      const eq = part.indexOf('=');
      const key = decodeURIComponent(eq >= 0 ? part.slice(0, eq) : part);
      const value = decodeURIComponent(eq >= 0 ? part.slice(eq + 1) : '');
      if (key) out[key] = value;
    }
    return Object.keys(out).length ? out : undefined;
  }

  if (typeof raw === 'object') {
    return raw as Record<string, string>;
  }

  return undefined;
}

function readQueryFromOptions(opts?: { query?: unknown }): Record<string, string> | undefined {
  return parseQueryValue(opts?.query);
}

export function readLaunchQuery(): Record<string, string> | undefined {
  try {
    const fromLaunch = readQueryFromOptions(wx.getLaunchOptionsSync());
    if (fromLaunch) return fromLaunch;
  } catch {
    // ignore
  }

  try {
    const wxAny = wx as WechatMinigame.Wx & {
      getEnterOptionsSync?: () => { query?: unknown };
    };
    if (typeof wxAny.getEnterOptionsSync === 'function') {
      return readQueryFromOptions(wxAny.getEnterOptionsSync());
    }
  } catch {
    // ignore
  }

  return undefined;
}

/** 兼容 roomId / roomID / ROOMID 等写法（编译模式里容易写错大小写） */
export function roomIdFromQuery(query?: Record<string, string>): string | undefined {
  if (!query) return undefined;

  for (const [key, value] of Object.entries(query)) {
    if (key.replace(/[_-]/g, '').toLowerCase() === 'roomid' && value?.trim()) {
      return value.trim().toUpperCase();
    }
  }

  return undefined;
}
