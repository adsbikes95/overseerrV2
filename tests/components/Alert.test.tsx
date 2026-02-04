import Alert from '@app/components/Common/Alert';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Alert Component', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(<Alert>Test alert message</Alert>);

      expect(screen.getByText('Test alert message')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Alert title="Alert Title">Content</Alert>);

      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should render both title and children', () => {
      render(<Alert title="Title">Body content</Alert>);

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('should render without title', () => {
      render(<Alert>Content only</Alert>);

      expect(screen.getByText('Content only')).toBeInTheDocument();
    });

    it('should render without children', () => {
      render(<Alert title="Title only" />);

      expect(screen.getByText('Title only')).toBeInTheDocument();
    });
  });

  describe('alert types', () => {
    describe('warning type (default)', () => {
      it('should apply warning styles by default', () => {
        const { container } = render(<Alert>Warning message</Alert>);

        const alertDiv = container.firstChild as HTMLElement;
        expect(alertDiv.className).toContain('border-yellow-500');
        expect(alertDiv.className).toContain('bg-yellow-400');
      });

      it('should apply warning styles explicitly', () => {
        const { container } = render(
          <Alert type="warning">Warning message</Alert>
        );

        const alertDiv = container.firstChild as HTMLElement;
        expect(alertDiv.className).toContain('border-yellow-500');
        expect(alertDiv.className).toContain('bg-yellow-400');
      });

      it('should have yellow text colors for warning', () => {
        render(<Alert title="Warning Title">Warning body</Alert>);

        const title = screen.getByText('Warning Title');
        expect(title.className).toContain('text-yellow-100');

        const body = screen.getByText('Warning body');
        expect(body.className).toContain('text-yellow-300');
      });
    });

    describe('info type', () => {
      it('should apply info styles', () => {
        const { container } = render(<Alert type="info">Info message</Alert>);

        const alertDiv = container.firstChild as HTMLElement;
        expect(alertDiv.className).toContain('border-indigo-500');
        expect(alertDiv.className).toContain('bg-indigo-400');
      });

      it('should have gray text colors for info', () => {
        render(
          <Alert type="info" title="Info Title">
            Info body
          </Alert>
        );

        const title = screen.getByText('Info Title');
        expect(title.className).toContain('text-gray-100');

        const body = screen.getByText('Info body');
        expect(body.className).toContain('text-gray-300');
      });
    });

    describe('error type', () => {
      it('should apply error styles', () => {
        const { container } = render(<Alert type="error">Error message</Alert>);

        const alertDiv = container.firstChild as HTMLElement;
        expect(alertDiv.className).toContain('bg-red-600');
      });

      it('should have red text colors for error', () => {
        render(
          <Alert type="error" title="Error Title">
            Error body
          </Alert>
        );

        const title = screen.getByText('Error Title');
        expect(title.className).toContain('text-red-100');

        const body = screen.getByText('Error body');
        expect(body.className).toContain('text-red-300');
      });
    });
  });

  describe('structure', () => {
    it('should have flex layout', () => {
      const { container } = render(<Alert>Content</Alert>);

      const flexDiv = container.querySelector('.flex');
      expect(flexDiv).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      const { container } = render(<Alert>Content</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('rounded-md');
    });

    it('should have padding', () => {
      const { container } = render(<Alert>Content</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('p-4');
    });

    it('should have margin bottom', () => {
      const { container } = render(<Alert>Content</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('mb-4');
    });

    it('should have an icon container with flex-shrink-0', () => {
      const { container } = render(<Alert>Content</Alert>);

      const iconContainer = container.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have ml-3 on content container', () => {
      const { container } = render(<Alert>Content</Alert>);

      const contentContainer = container.querySelector('.ml-3');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should render warning icon for warning type', () => {
      const { container } = render(<Alert type="warning">Warning</Alert>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('class')).toContain('h-5');
      expect(svg?.getAttribute('class')).toContain('w-5');
    });

    it('should render info icon for info type', () => {
      const { container } = render(<Alert type="info">Info</Alert>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render error icon for error type', () => {
      const { container } = render(<Alert type="error">Error</Alert>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have icon with h-5 w-5 classes', () => {
      const { container } = render(<Alert>Content</Alert>);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('h-5');
      expect(svg?.getAttribute('class')).toContain('w-5');
    });
  });

  describe('title styling', () => {
    it('should have font-medium on title', () => {
      render(<Alert title="Test Title">Content</Alert>);

      const title = screen.getByText('Test Title');
      expect(title.className).toContain('font-medium');
    });

    it('should have text-sm on title', () => {
      render(<Alert title="Test Title">Content</Alert>);

      const title = screen.getByText('Test Title');
      expect(title.className).toContain('text-sm');
    });
  });

  describe('body styling', () => {
    it('should have text-sm on body', () => {
      render(<Alert>Body content</Alert>);

      const body = screen.getByText('Body content');
      expect(body.className).toContain('text-sm');
    });

    it('should have mt-2 when title is present', () => {
      render(<Alert title="Title">Body content</Alert>);

      const body = screen.getByText('Body content');
      expect(body.className).toContain('mt-2');
    });

    it('should have first:mt-0 class for no margin when no title', () => {
      render(<Alert>Body only</Alert>);

      const body = screen.getByText('Body only');
      expect(body.className).toContain('first:mt-0');
    });
  });

  describe('ReactNode support', () => {
    it('should support JSX in title', () => {
      render(
        <Alert title={<span data-testid="custom-title">Custom Title</span>}>
          Content
        </Alert>
      );

      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('should support JSX in children', () => {
      render(
        <Alert>
          <span data-testid="custom-content">Custom Content</span>
        </Alert>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('should support complex children', () => {
      render(
        <Alert>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </Alert>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('backdrop blur', () => {
    it('should have backdrop-blur for warning type', () => {
      const { container } = render(<Alert type="warning">Warning</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('backdrop-blur');
    });

    it('should have backdrop-blur for info type', () => {
      const { container } = render(<Alert type="info">Info</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('backdrop-blur');
    });

    it('should not have backdrop-blur for error type', () => {
      const { container } = render(<Alert type="error">Error</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).not.toContain('backdrop-blur');
    });
  });

  describe('opacity', () => {
    it('should have bg-opacity-20 for warning type', () => {
      const { container } = render(<Alert type="warning">Warning</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('bg-opacity-20');
    });

    it('should have bg-opacity-20 for info type', () => {
      const { container } = render(<Alert type="info">Info</Alert>);

      const alertDiv = container.firstChild as HTMLElement;
      expect(alertDiv.className).toContain('bg-opacity-20');
    });
  });
});
