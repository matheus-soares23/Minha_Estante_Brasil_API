import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('default-queue') private readonly queue: Queue) {}

  // Publisher: adiciona um job na fila
  async addJob(jobName: string, data: any) {
    const job = await this.queue.add(jobName, data, {
      attempts: 3, // número de tentativas em caso de falha
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    this.logger.log(`Job ${job.id} adicionado à fila: ${jobName}`);
    return job;
  }

  async sendEmailJob(email: string, subject: string, content: string) {
    console.log(`Enviando email para ${email} com assunto "${subject}"`);
    return this.addJob('send-email', { email, subject, content });
  }

  async sendNotificationJob(userId: number, message: string) {
    return this.addJob('send-notification', { userId, message });
  }
}
