import { presentToastMessage } from '../toast-chrome';
import { showToast } from '@/components/ui/Toast';

jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

const mockedShowToast = jest.mocked(showToast);

describe('presentToastMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the message as the error title without saying Error', () => {
    presentToastMessage('Sign in before spending Momenta.', 'error');

    expect(mockedShowToast.error).toHaveBeenCalledWith(
      'Sign in before spending Momenta.'
    );
    expect(mockedShowToast.error).not.toHaveBeenCalledWith(
      'Error',
      expect.anything()
    );
  });

  it('uses the message as the success title without saying Success', () => {
    presentToastMessage('Choice saved', 'success');

    expect(mockedShowToast.success).toHaveBeenCalledWith('Choice saved');
    expect(mockedShowToast.success).not.toHaveBeenCalledWith(
      'Success',
      expect.anything()
    );
  });

  it('uses the message as the info title without saying Info', () => {
    presentToastMessage('Reminders are finishing setup.', 'info');

    expect(mockedShowToast.info).toHaveBeenCalledWith(
      'Reminders are finishing setup.'
    );
    expect(mockedShowToast.info).not.toHaveBeenCalledWith(
      'Info',
      expect.anything()
    );
  });
});
