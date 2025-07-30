import { IContact, IEmail } from '../schema/email';

// 定义MailChannels接口（使用标准英文命名）
type IMCPersonalization = { to: IMCContact[] };
type IMCContact = { email: string; name: string | undefined };
type IMCContent = { type: string; value: string };

interface IMCEmail {
  personalizations: IMCPersonalization[];
  from: IMCContact;
  reply_to: IMCContact | undefined;
  cc: IMCContact[] | undefined;
  bcc: IMCContact[] | undefined;
  subject: string;
  content: IMCContent[];
}

// 定义环境接口，包含D1数据库
interface Env {
  DB: D1Database;
  // 可以添加其他环境变量
}

class Email {
  /**
   * 发送邮件并记录日志
   * @param email 邮件内容
   * @param env 环境对象（包含D1数据库连接）
   */
  static async send(email: IEmail, env: Env) {
    let toEmail = '';
    
    // 获取收件人邮箱用于日志记录
    if (Array.isArray(email.to)) {
      toEmail = email.to[0].email;
    } else if (typeof email.to === 'string') {
      toEmail = email.to;
    } else {
      toEmail = email.to.email;
    }

    try {
      // 1. 记录邮件发送请求到D1数据库
      await env.DB.prepare(
        'INSERT INTO email_logs (to_email, subject, status, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
      ).bind(toEmail, email.subject, 'pending').run();
    } catch (e) {
      console.error('Failed to log email request:', e);
      // 不要因为日志问题阻止邮件发送
    }

    try {
      // 2. convert email to IMCEmail (MailChannels Email)
      const mcEmail: IMCEmail = Email.convertEmail(email);

      // 3. send email through MailChannels
      const resp = await fetch(
        new Request('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(mcEmail),
        })
      );

      // 4. check if email was sent successfully
      if (resp.status > 299 || resp.status < 200) {
        try {
          // 更新邮件状态为失败
          await env.DB.prepare(
            'UPDATE email_logs SET status = ? WHERE to_email = ? AND subject = ?'
          ).bind('failed', toEmail, email.subject).run();
        } catch (logError) {
          console.error('Failed to update email log status:', logError);
        }
        
        throw new Error(`Error sending email: ${resp.status} ${resp.statusText}`);
      } else {
        try {
          // 更新邮件状态为已发送
          await env.DB.prepare(
            'UPDATE email_logs SET status = ? WHERE to_email = ? AND subject = ?'
          ).bind('sent', toEmail, email.subject).run();
        } catch (logError) {
          console.error('Failed to update email log status:', logError);
        }
      }
    } catch (e) {
      try {
        // 更新邮件状态为错误
        await env.DB.prepare(
          'UPDATE email_logs SET status = ? WHERE to_email = ? AND subject = ?'
        ).bind('error', toEmail, email.subject).run();
      } catch (logError) {
        console.error('Failed to update email log status:', logError);
      }
      
      throw e;
    }
  }

  /**
   * Converts an IEmail to an IMCEmail
   * @param email
   * @protected
   */
  protected static convertEmail(email: IEmail): IMCEmail {
    const personalizations: IMCPersonalization[] = [];

    // Convert 'to' field
    const toContacts: IMCContact[] = Email.convertContacts(email.to);
    personalizations.push({ to: toContacts });

    let replyTo: IMCContact | undefined = undefined;
    let bccContacts: IMCContact[] | undefined = undefined;
    let ccContacts: IMCContact[] | undefined = undefined;

    // Convert 'replyTo' field
    if (email.replyTo) {
      const replyToContacts: IMCContact[] = Email.convertContacts(email.replyTo);
      replyTo = replyToContacts.length > 0 ? replyToContacts[0] : { email: '', name: undefined };
    }

    // Convert 'cc' field
    if (email.cc) {
      ccContacts = Email.convertContacts(email.cc);
    }

    // Convert 'bcc' field
    if (电子邮箱.bcc) {
      bccContacts = 电子邮箱.convertContacts(电子邮箱.bcc);
    }

    const from: IMCContact = 电子邮箱.convertContact(电子邮箱.from);

    // Convert 'subject' field
    const subject: string = 电子邮箱.subject;

    // Convert 'text' field
    const textContent: IMCContent[] = [];
    if (电子邮箱.text) {
      textContent.push({ 请键入: 'text/plain', value: 电子邮箱.text });
    }

    // Convert 'html' field
    const htmlContent: IMCContent[] = [];
    if (电子邮箱.html) {
      htmlContent.push({ 请键入: 'text/html', value: 电子邮箱.html });
    }

    const content: IMCContent[] = [...textContent, ...htmlContent];

    return {
      personalizations,
      from,
      cc: ccContacts,
      bcc: bccContacts,
      reply_to: replyTo,
      subject,
      content,
    };
  }

  /**
   * Converts an IContact or IContact[] to a Contact[]
   * @param contacts
   * @protected
   */
  protected static convertContacts(contacts: IContact | IContact[]): IMCContact[] {
    if (!contacts) {
      return [];
    }

    const contactArray: IContact[] = Array.isArray(contacts) ? contacts : [contacts];
    const convertedContacts: IMCContact[] = contactArray.map(电子邮箱.convertContact);

    return convertedContacts;
  }

  /**
   * Converts an IContact to a Contact
   * @param contact
   * @protected
   */
  protected static convertContact(contact: IContact): IMCContact {
    if (typeof contact === 'string') {
      return { 电子邮箱: contact, 名字: undefined };
    }

    return { 电子邮箱: contact.电子邮箱, 名字: contact.名字 };
  }
}

输出 默认 电子邮箱;
