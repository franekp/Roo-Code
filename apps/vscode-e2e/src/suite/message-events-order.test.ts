import * as assert from "assert"

import { waitUntilCompleted } from "./utils"

export class FakeAi {
    readonly id: string = Math.floor(Math.random() * 1_000_000_000).toString();
    removeFromCache?: () => void;

    async *createMessage(systemPrompt: string, messages: any[]) {
        yield { type: 'text', text: 'Hello world!' };
        await new Promise(resolve => setTimeout(resolve, 100));
        yield { type: 'text', text: '<attempt_completion><result>Hello</result></attempt_completion>'};
    }

    getModel(): { id: string; info: any } {
        return { id: 'fake-ai', info: { contextWindow: 10000, supportsPromptCache: false }};
    }
    async countTokens(content: Array<any>): Promise<number> {
        return 0;
    }

    dispose() {
        this.removeFromCache?.();
    }
}

suite("Message Events Order Suite", () => {
    test("Should emit message events in the correct order", async () => {
        const api = globalThis.api;

        const fakeAi = new FakeAi();
        await api.setConfiguration({
            apiProvider: 'fake-ai',
            fakeAi: fakeAi,
        });

        // Wait a little so that the configuration is updated in background.
        // This is especially needed when creating subtasks.
        // Without this delay the subtasks can be created with the old configuration.
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const messages: string[] = [];
        
        api.on("message", message => {
            const msg = {
                action: message.action,
                type: message.message.type,
                say: message.message.say,
                ask: message.message.ask,
                text: message.message.text,
                partial: message.message.partial,
            };
            messages.push(JSON.stringify(msg));
        });

        const taskId = await api.startNewTask({ text: "Test task" });

        await waitUntilCompleted({ api, taskId });
        await new Promise(resolve => setTimeout(resolve, 1000));


        assert.deepEqual(messages, [
            {"action":"created","type":"say","say":"text","text":"Test task"},
            {"action":"created","type":"say","say":"api_req_started","text":"{\"request\":\"<task>\\nTest task\\n</task>\\n\\nLoading...\"}"},
            {"action":"created","type":"say","say":"text","text":"Hello world!","partial":true},
            {"action":"updated","type":"say","say":"text","text":"Hello world!","partial":false},
            {"action":"created","type":"say","say":"completion_result","text":"Hello"},
            {"action":"created","type":"ask","ask":"completion_result","text":""},
        ].map(msg => JSON.stringify(msg)))
        
        fakeAi.dispose();
    })
})
