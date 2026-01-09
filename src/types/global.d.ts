/// <reference types="react" />

// Ensure JSX namespace is available for React 19 compatibility with react-jsx transform
import React from 'react';

declare global {
  namespace JSX {
    type Element = React.ReactElement;
  }
}

export {};
