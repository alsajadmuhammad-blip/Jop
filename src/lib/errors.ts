
'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class PermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `PermissionError: Missing or insufficient permissions for operation: ${context.operation} on ${context.path}\nContext: ${JSON.stringify(context, null, 2)}`;
    super(message);
    this.name = 'PermissionError';
    this.context = context;

    // Make the error visible in dev overlays
    (this as any).digest = `PERMISSION_ERROR: ${context.operation} on ${context.path}`;
  }
}
