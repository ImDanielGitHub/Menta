import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PromisePeopleShortcut } from '@/components/home/PromisePeopleShortcut';
import { ThemeProvider } from '@/constants/ThemeContext';
import { usePromiseAccountability } from '@/hooks/usePromiseAccountability';

jest.mock('@/hooks/usePromiseAccountability', () => ({
  usePromiseAccountability: jest.fn(),
}));

const mockUsePromiseAccountability = jest.mocked(usePromiseAccountability);

describe('PromisePeopleShortcut', () => {
  it('makes inviting someone the direct Today action for a private promise', () => {
    mockUsePromiseAccountability.mockReturnValue({
      data: {
        members: [
          {
            id: 'owner',
            name: 'Daniel',
            avatarUrl: null,
            role: 'owner',
            participates: true,
            proofStatus: 'none',
          },
        ],
      },
      isLoading: false,
    } as ReturnType<typeof usePromiseAccountability>);
    const onPress = jest.fn();

    render(
      <ThemeProvider>
        <PromisePeopleShortcut challengeId="promise-1" onPress={onPress} />
      </ThemeProvider>
    );

    expect(screen.getByText('Bring someone into this promise')).toBeTruthy();
    expect(
      screen.getByText('Do it together, ask for review, or get support')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('today-promise-people'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('names confirmed people only after they are members', () => {
    mockUsePromiseAccountability.mockReturnValue({
      data: {
        members: [
          {
            id: 'owner',
            name: 'Daniel',
            avatarUrl: null,
            role: 'owner',
            participates: true,
            proofStatus: 'approved',
          },
          {
            id: 'alex',
            name: 'Alex Morgan',
            avatarUrl: null,
            role: 'partner',
            participates: true,
            proofStatus: 'approved',
          },
        ],
      },
      isLoading: false,
    } as ReturnType<typeof usePromiseAccountability>);

    render(
      <ThemeProvider>
        <PromisePeopleShortcut challengeId="promise-1" onPress={jest.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText('People in this promise')).toBeTruthy();
    expect(
      screen.getByText('Alex Morgan · Open roles and progress')
    ).toBeTruthy();
  });
});
