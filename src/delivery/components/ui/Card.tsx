import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (<div className={`bg-black/20 border border-purple-500/20 rounded-lg shadow-md ${className}`}>{children}</div>);
export const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (<div className="p-4 border-b border-purple-500/20">{children}</div>);
export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (<h2 className={`text-base font-semibold ${className}`}>{children}</h2>);
export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (<div className={`p-4 ${className}`}>{children}</div>);
