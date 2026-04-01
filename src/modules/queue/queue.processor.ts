import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('default-queue')
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  // Consumer: processa jobs do tipo 'send-email'
  @Process('send-email')
  async handleSendEmail(
    job: Job<{ email: string; subject: string; content: string }>,
  ) {
    this.logger.log(`Processando envio de email para: ${job.data.email}`);

    // Simula processamento
    await this.delay(2000);

    this.logger.log(
      `Email enviado para ${job.data.email} - Assunto: ${job.data.subject}`,
    );

    return { sent: true, email: job.data.email };
  }

  // Consumer: processa jobs do tipo 'send-notification'
  @Process('send-notification')
  async handleSendNotification(job: Job<{ userId: number; message: string }>) {
    this.logger.log(`Processando notificação para usuário: ${job.data.userId}`);

    // Simula processamento
    await this.delay(1000);

    this.logger.log(
      `Notificação enviada para usuário ${job.data.userId}: ${job.data.message}`,
    );

    return { sent: true, userId: job.data.userId };
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} do tipo ${job.name} iniciado`);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.debug(
      `Job ${job.id} completado com resultado: ${JSON.stringify(result)}`,
    );
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} falhou: ${error.message}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
