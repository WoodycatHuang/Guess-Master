export function promptNickname(defaultValue = ''): Promise<string | null> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '输入昵称',
      editable: true,
      placeholderText: '你的昵称',
      content: defaultValue,
      success: (res) => {
        if (res.confirm && res.content?.trim()) {
          resolve(res.content.trim());
        } else {
          resolve(null);
        }
      },
      fail: () => resolve(null),
    });
  });
}

export function promptRoomId(defaultValue = ''): Promise<string | null> {
  return new Promise((resolve) => {
    wx.showModal({
      title: '输入房间号',
      editable: true,
      placeholderText: '6 位房间号',
      content: defaultValue,
      success: (res) => {
        if (res.confirm && res.content?.trim()) {
          resolve(res.content.trim().toUpperCase());
        } else {
          resolve(null);
        }
      },
      fail: () => resolve(null),
    });
  });
}
