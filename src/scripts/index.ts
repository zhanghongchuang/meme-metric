import { CommandFactory } from 'nest-commander';
import { CommandModule } from './command.module';

async function bootstrap() {
  try {
    await CommandFactory.run(CommandModule, ['warn', 'error']);
  } catch (error) {
    console.error('启动命令行失败:', error);
    process.exit(1);
  }
}

bootstrap();