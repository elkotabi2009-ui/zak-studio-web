import React, { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'rounded-2xl border border-secondary-200 bg-white shadow-card transition-all duration-300 dark:border-secondary-800 dark:bg-secondary-900',
      hover: 'rounded-2xl border border-secondary-200 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 dark:border-secondary-800 dark:bg-secondary-900',
      bordered: 'rounded-2xl border-2 border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900',
      elevated: 'rounded-2xl bg-white shadow-elevation-3 dark:bg-secondary-900 dark:shadow-elevation-4',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('heading-h4', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-body text-secondary-600 dark:text-secondary-400 mt-1', className)} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-800', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  aspectRatio?: 'square' | 'video' | 'golden' | 'portrait';
  objectFit?: 'cover' | 'contain' | 'fill';
}

export const CardMedia = forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, aspectRatio = 'video', objectFit = 'cover', children, ...props }, ref) => {
    const ratios = {
      square: 'aspect-square',
      video: 'aspect-video',
      golden: 'aspect-[1.618/1]',
      portrait: 'aspect-[3/4]',
    };

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden rounded-xl', ratios[aspectRatio], className)}
        {...props}
      >
        {children &&
          typeof children === 'object' &&
          'props' in children &&
          typeof children.props?.src === 'string' &&
          React.isValidElement(children) ? (
            React.cloneElement(children as React.ReactElement, {
              className: cn('w-full h-full object-cover transition-transform duration-500 group-hover:scale-105', children.props.className),
              alt: children.props.alt || '',
            })
          ) : (
            <div className={cn('w-full h-full', objectFit === 'cover' && 'object-cover', objectFit === 'contain' && 'object-contain')}>
              {children}
            </div>
          )}
      </div>
    );
  }
);

CardMedia.displayName = 'CardMedia';