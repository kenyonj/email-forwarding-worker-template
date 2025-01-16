import { Config } from "./config";
import { Processor } from "./processor";

export default {
  async email(message: any, env: any): Promise<void> {
    const config = new Config(message.to, env);
    const processor = new Processor(message, config);

    return await processor.process();
  },
};
