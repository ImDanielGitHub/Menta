import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import {
  IPadShopCatalogueWorkspace,
  IPadShopDetailWorkspace,
} from '@/components/ipad/IPadShopWorkspace';

describe('iPad Shop workspaces', () => {
  it('keeps catalogue context and shelves in separate panes', () => {
    render(
      <IPadShopCatalogueWorkspace sidebar={<Text>Shop context</Text>}>
        <Text>Catalogue shelves</Text>
      </IPadShopCatalogueWorkspace>
    );

    expect(screen.getByTestId('ipad-shop-catalogue-workspace')).toBeTruthy();
    expect(screen.getByText('Shop context')).toBeTruthy();
    expect(screen.getByText('Catalogue shelves')).toBeTruthy();
  });

  it('keeps the item visual, details, and actions in one split workspace', () => {
    render(
      <IPadShopDetailWorkspace
        visual={<Text>Item visual</Text>}
        details={<Text>Item details</Text>}
        actions={<Text>Purchase actions</Text>}
      />
    );

    expect(screen.getByTestId('ipad-shop-detail-workspace')).toBeTruthy();
    expect(screen.getByText('Item visual')).toBeTruthy();
    expect(screen.getByText('Item details')).toBeTruthy();
    expect(screen.getByText('Purchase actions')).toBeTruthy();
  });
});
