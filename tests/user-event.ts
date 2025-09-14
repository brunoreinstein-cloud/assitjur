import { fireEvent, act } from '@testing-library/react';

export default {
  setup: () => ({
    click: async (element: Element) => {
      await act(async () => {
        fireEvent.click(element);
      });
    },
    type: async (element: HTMLElement, text: string) => {
      await act(async () => {
        fireEvent.change(element, { target: { value: text } });
      });
    },
  }),
};
