import React from 'react';
import { PLACEHOLDERS } from '../data/placeholders';
import { Mail, Phone, User } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground">Get in touch with the Trishul support team.</p>
      </div>

      <div className="grid gap-6 p-8 border border-border rounded-xl bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-lg font-semibold">{PLACEHOLDERS.CONTACT_US.NAME}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{PLACEHOLDERS.CONTACT_US.EMAIL}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Phone size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p className="text-lg font-semibold">{PLACEHOLDERS.CONTACT_US.PHONE}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
