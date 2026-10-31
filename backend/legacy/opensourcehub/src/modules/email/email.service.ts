import { Inject,Injectable,Logger,Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { errorMessage } from '../../common/utils/errors.util';
import { escapeHtml,safeHttpsUrl } from '../../common/utils/html.util';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resendClient: Resend | null = null;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(
    @Optional() @Inject(ConfigService) private configService?: ConfigService,
  ) {
    const apiKey =
      this.configService?.get<string>('resend.apiKey') ||
      process.env.RESEND_API_KEY ||
      '';
    this.fromEmail =
      this.configService?.get<string>('resend.fromEmail') ||
      process.env.RESEND_FROM_EMAIL ||
      'OpenSourceHub <opensourcehub@vikrant.sbs>';
    this.frontendUrl =
      this.configService?.get<string>('frontendUrl') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    if (apiKey && apiKey.trim().length > 0) {
      this.resendClient = new Resend(apiKey.trim());
      this.logger.log(`Resend client initialized with sender: ${this.fromEmail}`);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not set. Outgoing emails will be logged in simulated mode.',
      );
    }
  }

  public get isConfigured(): boolean { return this.resendClient !== null; }

  public async sendPersonalizedDigestEmail(
    recipientEmail: string,
    digestData: {
      recipient: { username: string; name: string; email: string };
      frequency: string;
      primaryLanguage: string;
      techStack: string[];
      generatedDate: string;
      issuesCount: number;
      curatedIssues: Array<{
        id: string;
        number: number;
        title: string;
        repo: string;
        htmlUrl: string;
        commentsCount: number;
      }>;
      featuredProjects: Array<{
        name: string;
        fullName: string;
        owner: string;
        stars: number;
        description: string;
        htmlUrl: string;
      }>;
      nextStepAction: string;
    },
    idempotencyKey?: string,
  ): Promise<{ success: boolean; id?: string; simulated?: boolean; error?: string }> {
    const issuesHtml = (digestData.curatedIssues || [])
      .map(
        (issue) => `
        <div style="background: #ffffff; border: 2px solid #000000; box-shadow: 3px 3px 0 #000000; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: #555555; margin-bottom: 4px; font-family: monospace;">
            <span style="background: #eeeeee; padding: 2px 6px; border: 1px solid #cccccc; border-radius: 4px;">${escapeHtml(issue.repo)}</span>
            <span style="margin-left: 6px;">#${Number(issue.number) || 0}</span>
            <span style="margin-left: 6px; color: #4285f4;">💬 ${Number(issue.commentsCount) || 0} comments</span>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #000000; margin-bottom: 10px; line-height: 1.3;">
            ${escapeHtml(issue.title)}
          </div>
          <a href="${safeHttpsUrl(issue.htmlUrl)}" target="_blank" rel="noopener noreferrer" style="background-color: #fbbc05; color: #000000; font-weight: 800; text-decoration: none; padding: 6px 14px; border: 1.5px solid #000000; display: inline-block; font-size: 11px; box-shadow: 2px 2px 0 #000000; border-radius: 4px; font-family: monospace;">
            CLAIM & VIEW ON GITHUB ↗
          </a>
        </div>
      `,
      )
      .join('');

    const projectsHtml = (digestData.featuredProjects || [])
      .map(
        (p) => `
        <div style="background: #ffffff; border: 2px solid #000000; box-shadow: 3px 3px 0 #000000; padding: 14px; margin-bottom: 12px; border-radius: 8px;">
          <div style="font-size: 14px; font-weight: 800; color: #000000; margin-bottom: 4px;">
            ${escapeHtml(p.fullName)} <span style="font-size: 12px; font-weight: 600; color: #666666;">⭐ ${(Number(p.stars) || 0).toLocaleString()}</span>
          </div>
          <div style="font-size: 12px; color: #444444; margin-bottom: 8px; line-height: 1.4;">
            ${escapeHtml(p.description) || 'Open source repository actively looking for contributors.'}
          </div>
          <a href="${safeHttpsUrl(p.htmlUrl)}" target="_blank" rel="noopener noreferrer" style="color: #4285f4; font-weight: 700; font-size: 12px; text-decoration: underline; font-family: monospace;">
            Inspect Repository ➔
          </a>
        </div>
      `,
      )
      .join('');

    const techChips = (digestData.techStack || [])
      .map(
        (t) =>
          `<span style="background: #fff8e7; border: 1.5px solid #000000; padding: 3px 8px; font-size: 11px; font-weight: 700; font-family: monospace; border-radius: 4px; margin-right: 6px; display: inline-block;">${escapeHtml(t)}</span>`,
      )
      .join(' ');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenSourceHub Issue Digest</title>
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #f7f3e8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fffbf0; border: 3px solid #000000; box-shadow: 6px 6px 0 #000000; border-radius: 16px; padding: 28px;">

          <!-- Header Banner -->
          <div style="margin-bottom: 20px;">
            <div style="background-color: #4285f4; color: #ffffff; padding: 6px 12px; display: inline-block; font-weight: 800; font-size: 11px; border: 2px solid #000000; box-shadow: 2px 2px 0 #000000; border-radius: 6px; font-family: monospace; text-transform: uppercase;">
              OPENSOURCEHUB // ISSUE DIGEST
            </div>
            <h1 style="font-size: 26px; font-weight: 900; margin: 12px 0 6px 0; color: #000000; text-transform: uppercase; letter-spacing: -0.5px;">
              Your Tailored Contribution Sprint
            </h1>
            <p style="font-size: 13px; color: #444444; margin: 0; line-height: 1.5;">
              Hi <strong>${escapeHtml(digestData.recipient.name || digestData.recipient.username)}</strong>, here is your ${escapeHtml(digestData.frequency)} handpicked digest of beginner-friendly issues curated to your tech stack.
            </p>
          </div>

          <!-- Matched Tech Stack -->
          <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 3px 3px 0 #000000; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
            <div style="font-size: 11px; font-weight: 800; color: #000000; text-transform: uppercase; margin-bottom: 6px; font-family: monospace;">
              TARGETED TECH STACK:
            </div>
            <div>${techChips}</div>
          </div>

          <!-- Good First Issues Section -->
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 16px; font-weight: 900; color: #000000; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 2px solid #000000; padding-bottom: 6px; font-family: monospace;">
              🎯 Good First Issues (${digestData.curatedIssues?.length || 0})
            </h2>
            ${issuesHtml || '<p style="font-size: 13px; color: #666;">No open issues found matching your exact language filters right now.</p>'}
          </div>

          <!-- Recommended Repositories Section -->
          ${
            digestData.featuredProjects?.length > 0
              ? `
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 16px; font-weight: 900; color: #000000; text-transform: uppercase; margin: 0 0 12px 0; border-bottom: 2px solid #000000; padding-bottom: 6px; font-family: monospace;">
                ⭐ Trending Repositories
              </h2>
              ${projectsHtml}
            </div>
          `
              : ''
          }

          <!-- Kanban Board CTA -->
          <div style="background-color: #eaf2ff; border: 2px solid #000000; box-shadow: 4px 4px 0 #000000; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 15px; font-weight: 800; color: #1a56db; margin-bottom: 12px;">
              💡 ${escapeHtml(digestData.nextStepAction)}
            </div>
            <a href="${this.frontendUrl}/saved/issues" target="_blank" style="background-color: #34a853; color: #ffffff; font-weight: 900; text-decoration: none; padding: 12px 24px; border: 2px solid #000000; display: inline-block; font-size: 13px; box-shadow: 3px 3px 0 #000000; border-radius: 8px; text-transform: uppercase; font-family: monospace;">
              TRACK ON KANBAN BOARD ➔
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 2px solid #000000; padding-top: 16px; font-size: 11px; color: #666666; font-family: monospace; line-height: 1.5;">
            Sent by <strong>OpenSourceHub</strong> • <a href="mailto:opensourcehub@vikrant.sbs" style="color: #4285f4;">opensourcehub@vikrant.sbs</a><br/>
            You can modify your subscription or cadence anytime in your
            <a href="${this.frontendUrl}/settings" style="color: #000000; font-weight: 700;">Account Settings</a>.
          </div>

        </div>
      </body>
      </html>
    `;

    if (!this.resendClient) {
      this.logger.log(
        `[SIMULATED EMAIL DISPATCH] To: ${recipientEmail} | From: ${this.fromEmail} | Subject: 🎯 OpenSourceHub Issue Digest for ${digestData.recipient.username}`,
      );
      return {
        success: true,
        simulated: true,
      };
    }

    try {
      const result = await this.resendClient.emails.send({
        from: this.fromEmail,
        to: recipientEmail,
        subject: `🎯 OpenSourceHub Issue Digest for @${digestData.recipient.username} (${digestData.primaryLanguage})`,
        html,
      }, idempotencyKey ? { idempotencyKey } : undefined);

      if (result.error) {
        this.logger.error(`Resend API returned error: ${result.error.message}`);
        return {
          success: false,
          error: result.error.message,
        };
      }

      this.logger.log(
        `[Resend Email Dispatched] ID: ${result.data?.id} to ${recipientEmail}`,
      );
      return {
        success: true,
        id: result.data?.id,
        simulated: false,
      };
    } catch (err) {
      this.logger.error(`Failed to send email via Resend: ${errorMessage(err)}`);
      return {
        success: false,
        error: errorMessage(err),
      };
    }
  }
}
