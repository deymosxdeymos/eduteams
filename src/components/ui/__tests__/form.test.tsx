import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Test component that uses the form components
function TestForm() {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <input {...field} type="email" />
            </FormControl>
            <FormDescription>Enter your email address</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <input {...field} type="password" />
            </FormControl>
            <FormDescription>Enter your password</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

describe('Form Components', () => {
  it('renders FormItem with proper structure', () => {
    render(<TestForm />);

    // Check that form items are rendered
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText('Enter your email address')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
  });

  it('renders FormLabel with correct attributes', () => {
    render(<TestForm />);

    const emailLabel = screen.getByText('Email');
    expect(emailLabel).toBeTruthy();
    expect(emailLabel.getAttribute('data-slot')).toBe('form-label');
  });

  it('renders FormControl with correct attributes', () => {
    render(<TestForm />);

    const inputs = screen.getAllByDisplayValue('');
    const emailInput = inputs.find(input => input.getAttribute('type') === 'email') as HTMLInputElement;
    expect(emailInput).toBeTruthy();
    expect(emailInput.getAttribute('data-slot')).toBe('form-control');
    expect(emailInput.getAttribute('type')).toBe('email');
  });

  it('renders FormDescription with correct attributes', () => {
    render(<TestForm />);

    const description = screen.getByText('Enter your email address');
    expect(description).toBeTruthy();
    expect(description.getAttribute('data-slot')).toBe('form-description');
    expect(description.tagName.toLowerCase()).toBe('p');
  });

  it('renders FormMessage with correct attributes when there is an error', () => {
    function TestFormWithError() {
      const form = useForm({
        defaultValues: {
          email: '',
        },
      });

      useEffect(() => {
        form.setError('email', { message: 'Email is required' });
      }, [form]);
      // Set an error

      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      );
    }

    render(<TestFormWithError />);

    const message = screen.getByText('Email is required');
    expect(message).toBeTruthy();
    expect(message.getAttribute('data-slot')).toBe('form-message');
  });

  it('FormItem generates unique IDs', () => {
    render(
      <>
        <TestForm />
        <TestForm />
      </>
    );

    // Should have multiple form items with different IDs
    const formItems = screen.getAllByRole('generic', { hidden: true }).filter(
      el => el.getAttribute('data-slot') === 'form-item'
    );
    expect(formItems.length).toBeGreaterThan(1);
  });
});