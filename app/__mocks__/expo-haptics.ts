export const notificationAsync = jest.fn();
export const selectionAsync = jest.fn();
export const impactAsync = jest.fn();
export const NotificationFeedbackType = {
  Success: 'success',
  Error: 'error',
  Warning: 'warning',
};

export default {
  notificationAsync,
  selectionAsync,
  impactAsync,
  NotificationFeedbackType,
};
