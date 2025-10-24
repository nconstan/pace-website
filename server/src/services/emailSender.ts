import express, { Request, Response, Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch'; // For fetch polyfill

const router: Router = express.Router();

interface DocuSealSubmitter {
    name: string;
    email: string;
}

interface DocuSealSubmissionRequest {
    template: string;
    submitter: DocuSealSubmitter;
    values: Record<string, any>;
}

interface DocuSealSubmissionResponse {
    id: string;
    status: string;
}

// Microsoft Graph configuration
const config = {
  auth: {
    clientId: '882b4860-28fc-4956-8b62-b3aead3bbf84',
    authority: 'https://login.microsoftonline.com/265eba1b-7c76-4b76-99f6-f8ff9bdce5a9',
    clientSecret: process.env.EMAIL_CLIENT_SECRET
  }
};

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: config.auth.clientId,
    authority: config.auth.authority,
    clientSecret: config.auth.clientSecret
  }
});

// Microsoft Graph integration
async function getAccessToken(): Promise<string> {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  });
  if(!result) {
    throw new Error('Failed to get access token');
  }
  return result.accessToken;
}

async function sendEmail(toEmail: string, subject: string, body: string): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const client = Client.init({
      authProvider: (done: any) => {
        done(null, accessToken);
      }
    });

    const mail = {
      message: {
        subject: subject,
        body: { contentType: 'HTML', content: body },
        toRecipients: [{ emailAddress: { address: toEmail } }],
        from: { emailAddress: { address: 'binding@principalassetequity.com' } }
      },
      saveToSentItems: true
    };

    // Send from shared mailbox
    await client.api(`/users/binding@principalassetequity.com/sendMail`).post(mail);
    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Re-throw to handle in calling function
  }
}

async function submitToDocuSeal(request: DocuSealSubmissionRequest): Promise<DocuSealSubmissionResponse> {
    // Implementation for DocuSeal integration
    console.log('Submitting to DocuSeal:', request);
    return {
        id: 'dummy-id',
        status: 'submitted'
    };
}

// Express route handlers
const handleSendEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { toEmail, subject, body } = req.body;
    
    if (!toEmail || !subject || !body) {
        res.status(400).json({ error: "Email, subject, and body are required" });
        return;
    }
    
    await sendEmail(toEmail, subject, body);
    res.json({ message: "Email sent successfully" });
});

const handleDocuSealSubmission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { template, submitter, values } = req.body;
    
    if (!template || !submitter || !values) {
        res.status(400).json({ error: "Template, submitter, and values are required" });
        return;
    }
    
    const response = await submitToDocuSeal({ template, submitter, values });
    res.json({ message: "Document submitted successfully", data: response });
});

// Add routes to router
router.post('/send', handleSendEmail);
router.post('/docuseal', handleDocuSealSubmission);

// Export both the router and the sendEmail function for direct use
export { router as emailSenderRouter, sendEmail }; 