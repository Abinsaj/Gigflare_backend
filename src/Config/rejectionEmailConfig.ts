import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

dotenv.config()

const sentApplicationMail = async(email: string, status: 'accepted' | 'rejected'): Promise<boolean> =>{
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        }
    } as SMTPTransport.Options)

    console.log(transporter,' this is the credential for sending mail')

    const message =
        status === 'accepted'
            ? `
                <p>Congratulations! Your application has been approved. Welcome to GIGFLARE as a verified freelancer!</p>
                <p>We are excited to have you on board and look forward to seeing your contributions.</p>
            `
            : `
                <p>We regret to inform you that your application has been rejected. Please feel free to reach out if you have any questions or if you'd like feedback on your application.</p>
                <p>We encourage you to reapply in the future.</p>
            `;

    const mailOptions = {
        from: process.env.EMAIL as string,
        to: email,
        subject: 'GIGFLARE Freelancer Verificaion',
        html:  `
        <div style="font-family: Helvetica, Arial, sans-serif; min-width: 100px; overflow: auto; line-height: 2">
            <div style="margin: 50px auto; width: 70%; padding: 20px 0; text-align: center;">
                <p style="font-size: 1.1em;">Hi,</p>
                <p>This message is from GIGFLARE. Please see the status update regarding your application:</p>
                ${message}
                <p style="font-size: 0.9em;">Best Regards,<br />GIGFLARE Team</p>
                <hr style="border: none; border-top: 1px solid #eee" />
            </div>
        </div>
    `,
    };
    try {
        await transporter.sendMail(mailOptions)
        return true
    } catch (error) {
        console.log('error sending the mail',error)
        return false
    }

}

export default sentApplicationMail