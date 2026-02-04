import LoadingSpinner, {
  SmallLoadingSpinner,
} from '@app/components/Common/LoadingSpinner';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('LoadingSpinner Component', () => {
  describe('LoadingSpinner (default)', () => {
    it('should render an SVG element', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct viewBox', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 38 38');
    });

    it('should have large size classes (h-16 w-16)', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('h-16');
      expect(svg?.getAttribute('class')).toContain('w-16');
    });

    it('should have correct container height (h-64)', () => {
      const { container } = render(<LoadingSpinner />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('h-64');
    });

    it('should use currentColor for stroke', () => {
      render(<LoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('should have animation elements', () => {
      render(<LoadingSpinner />);

      const animateTransform = document.querySelector('animateTransform');
      expect(animateTransform).toBeInTheDocument();
      expect(animateTransform).toHaveAttribute('type', 'rotate');
      expect(animateTransform).toHaveAttribute('dur', '1s');
      expect(animateTransform).toHaveAttribute('repeatCount', 'indefinite');
    });

    it('should center content with flex', () => {
      const { container } = render(<LoadingSpinner />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex');
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('justify-center');
    });

    it('should have gray text color', () => {
      const { container } = render(<LoadingSpinner />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-gray-200');
    });
  });

  describe('SmallLoadingSpinner', () => {
    it('should render an SVG element', () => {
      render(<SmallLoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have small size classes (h-10 w-10)', () => {
      render(<SmallLoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('h-10');
      expect(svg?.getAttribute('class')).toContain('w-10');
    });

    it('should have full height container (h-full w-full)', () => {
      const { container } = render(<SmallLoadingSpinner />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('h-full');
      expect(wrapper.className).toContain('w-full');
    });

    it('should have same viewBox as large spinner', () => {
      render(<SmallLoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 38 38');
    });

    it('should have animation elements', () => {
      render(<SmallLoadingSpinner />);

      const animateTransform = document.querySelector('animateTransform');
      expect(animateTransform).toBeInTheDocument();
      expect(animateTransform).toHaveAttribute('repeatCount', 'indefinite');
    });

    it('should use currentColor for stroke', () => {
      render(<SmallLoadingSpinner />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });
  });

  describe('SVG structure', () => {
    it('should have a circle element', () => {
      render(<LoadingSpinner />);

      const circle = document.querySelector('circle');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('cx', '18');
      expect(circle).toHaveAttribute('cy', '18');
      expect(circle).toHaveAttribute('r', '18');
    });

    it('should have stroke opacity on background circle', () => {
      render(<LoadingSpinner />);

      const circle = document.querySelector('circle');
      expect(circle).toHaveAttribute('stroke-opacity', '.5');
    });

    it('should have a path element for the animated arc', () => {
      render(<LoadingSpinner />);

      const path = document.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d', 'M36 18c0-9.94-8.06-18-18-18');
    });

    it('should have correct animation rotation values', () => {
      render(<LoadingSpinner />);

      const animateTransform = document.querySelector('animateTransform');
      expect(animateTransform).toHaveAttribute('from', '0 18 18');
      expect(animateTransform).toHaveAttribute('to', '360 18 18');
    });

    it('should have group elements with proper structure', () => {
      render(<LoadingSpinner />);

      const groups = document.querySelectorAll('g');
      expect(groups.length).toBe(2);
    });

    it('should have stroke-width on inner group', () => {
      render(<LoadingSpinner />);

      const groups = document.querySelectorAll('g');
      const innerGroup = groups[1];
      expect(innerGroup).toHaveAttribute('stroke-width', '2');
    });
  });

  describe('accessibility', () => {
    it('should be visible in the DOM', () => {
      const { container } = render(<LoadingSpinner />);

      expect(container.firstChild).toBeVisible();
    });

    it('should render consistently', () => {
      const { container: container1 } = render(<LoadingSpinner />);
      const { container: container2 } = render(<LoadingSpinner />);

      const svg1 = container1.querySelector('svg');
      const svg2 = container2.querySelector('svg');

      expect(svg1?.outerHTML).toBe(svg2?.outerHTML);
    });
  });
});
