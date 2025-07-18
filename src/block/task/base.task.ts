export abstract class BaseTask {

    subTasks: BaseTask[] = [];

    abstract onMessage(message: any): Promise<void>;
    abstract onModuleInit(): void;

    onSchedule() {}

    addSubTasks(task): void {
        this.subTasks.push(task);
        console.log(`Subtask added: ${task.constructor.name}`);
    }

    executeSubTasks(message: any): Promise<void[]> {
        return Promise.all(
            this.subTasks.map((task) => task.onMessage(message))
        );
    }
}