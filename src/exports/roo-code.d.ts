import { EventEmitter } from "events"

export interface TokenUsage {
	totalTokensIn: number
	totalTokensOut: number
	totalCacheWrites?: number
	totalCacheReads?: number
	totalCost: number
	contextTokens: number
}

export interface RooCodeEvents {
	message: [{ taskId: string; action: "created" | "updated"; message: ClineMessage }]
	taskStarted: [taskId: string]
	taskPaused: [taskId: string]
	taskUnpaused: [taskId: string]
	taskAskResponded: [taskId: string]
	taskAborted: [taskId: string]
	taskSpawned: [taskId: string, childTaskId: string]
	taskCompleted: [taskId: string, usage: TokenUsage]
	taskTokenUsageUpdated: [taskId: string, usage: TokenUsage]
}

export interface RooCodeAPI extends EventEmitter<RooCodeEvents> {
	/**
	 * Starts a new task with an optional initial message and images.
	 * @param task Optional initial task message.
	 * @param images Optional array of image data URIs (e.g., "data:image/webp;base64,...").
	 * @returns The ID of the new task.
	 */
	startNewTask(task?: string, images?: string[]): Promise<string>

	/**
	 * Returns the current task stack.
	 * @returns An array of task IDs.
	 */
	getCurrentTaskStack(): string[]

	/**
	 * Clears the current task.
	 */
	clearCurrentTask(lastMessage?: string): Promise<void>

	/**
	 * Cancels the current task.
	 */
	cancelCurrentTask(): Promise<void>

	/**
	 * Sends a message to the current task.
	 * @param message Optional message to send.
	 * @param images Optional array of image data URIs (e.g., "data:image/webp;base64,...").
	 */
	sendMessage(message?: string, images?: string[]): Promise<void>

	/**
	 * Simulates pressing the primary button in the chat interface.
	 */
	pressPrimaryButton(): Promise<void>

	/**
	 * Simulates pressing the secondary button in the chat interface.
	 */
	pressSecondaryButton(): Promise<void>

	/**
	 * Sets the configuration for the current task.
	 * @param values An object containing key-value pairs to set.
	 */
	setConfiguration(values: Partial<ConfigurationValues>): Promise<void>

	/**
	 * Returns true if the API is ready to use.
	 */
	isReady(): boolean

	/**
	 * Returns the messages for a given task.
	 * @param taskId The ID of the task.
	 * @returns An array of ClineMessage objects.
	 */
	getMessages(taskId: string): ClineMessage[]

	/**
	 * Returns the token usage for a given task.
	 * @param taskId The ID of the task.
	 * @returns A TokenUsage object.
	 */
	getTokenUsage(taskId: string): TokenUsage

	/**
	 * Logs a message to the output channel.
	 * @param message The message to log.
	 */
	log(message: string): void
}

export type ClineAsk =
	/** LLM asks a question that user should respond to	*/
	| "followup"
	/** LLM asks for permisson to run terminal command */
	| "command"
	/** LLM asks for permission to read the terminal command output */
	| "command_output"
	/**
	 * After LLM say "completion_result", we need to show "Start New Task" button and wait for the user to click it
	 * — the "completion_result" ask will wait for that click
	 */
	| "completion_result"
	/** LLM asks for permission to use a tool (e.g. read file or apply a diff) */
	| "tool"
	/** Roo-Code failed to make an API request and asks whether to retry or give up (start a new task) */
	| "api_req_failed"
	/**
	 * The user triggered task resume, it became visible in the sidebar, and now the user is asked to confirm
	 * the resume
	 */
	| "resume_task"
	/**
	 * Similar to "resume_task", but for tasks that are already in completed state (there is only "start new task"
	 * button and no "resume task" button)
	 */
	| "resume_completed_task"
	/**
	 * It is a mistake when LLM in its answer did not used a tool or attempted completion. It is also a mistake
	 * when a tool is invoked without required arguments. Three mistakes will trigger this ask. User can give now
	 * more information to help LLM.
	 */
	| "mistake_limit_reached"
	/** LLM asks whether it can open an URL in the browser */
	| "browser_action_launch"
	/** LLM asks whether it can use MCP server to make an MCP API request */
	| "use_mcp_server"
	/**
	 * This is probably a bug. "finishTask" is a tool that signals that the subtask is completed. User is asked
	 * to confirm the completion, and then the "control flow" returns to the parent task.
	 */
	| "finishTask"

export type ClineSay =
	/** Probably a bug. Cannot find any place where "task" is used in "say" */
	| "task"
	/** Roo-Code informs LLM about some mistake (e.g. missing tool arguments) */
	| "error"
	/** Roo-Code starts making an API request and provides basic information about the environment */
	| "api_req_started"
	/**
	 * Roo-Code finished performing an API request. Data from this "say" are moved to "api_req_started" "say"
	 * and the "api_req_started" "say" is deleted. However cannot find any place where it is said.
	 */
	| "api_req_finished"
	/** Roo-Code failed to make an API request, asked the user whether to retry, and now signals the retry */
	| "api_req_retried"
	/** Like "api_req_retried", but we hit the rate limit and have to wait for some time before retrying */
	| "api_req_retry_delayed"
	/** Roo-Code says: "aggregated api_req metrics from deleted messages" */
	| "api_req_deleted"
	/** Generic text message said by the user, Roo-Code or LLM */
	| "text"
	/** As I understand, some LLMs can talk to themselves and verbose their thougths as "reasoning" */
	| "reasoning"
	/** Marks that the task is completed (green checkmark and some text) */
	| "completion_result"
	/** The user response for e.g. "followup" ask */
	| "user_feedback"
	/** LLM generated some file, but the user added some changes to it. This "say" informs about the changes done */
	| "user_feedback_diff"
	/** An output from a terminal command, so LLM knows the command output */
	| "command_output"
	/** This is probably a bug. Cannot find any place where "tool" is used in "say" */
	| "tool"
	/** Informs the user that the shell integration is unavailable */
	| "shell_integration_warning"
	/** LLM says what actions should be taken in the browser (scroll down, click, etc.) */
	| "browser_action"
	/** Roo-Code started launching the browser, this say triggers the loading spinner */
	| "browser_action_result"
	/** Probably a bug. Cannot find any place where "command" is used in "say" */
	| "command"
	/** Roo-Code started making an MCP server request, this say triggers the loading spinner */
	| "mcp_server_request_started"
	/** The response from the MCP server */
	| "mcp_server_response"
	/** Probably a bug. Cannot find any usage of "new_task_started" in the code */
	| "new_task_started"
	/** Probably a bug. This is a tool, not a "say" */
	| "new_task"
	/** Roo-Code saved a checkpoint */
	| "checkpoint_saved"
	/** Informs the LLM that it does not have access to a file, because it is listed in ".rooignore" */
	| "rooignore_error"

export interface ClineMessage {
	ts: number
	type: "ask" | "say"
	ask?: ClineAsk
	say?: ClineSay
	text?: string
	images?: string[]
	partial?: boolean
	reasoning?: string
	conversationHistoryIndex?: number
	checkpoint?: Record<string, unknown>
	progressStatus?: ToolProgressStatus
}

export type SecretKey =
	| "apiKey"
	| "glamaApiKey"
	| "openRouterApiKey"
	| "awsAccessKey"
	| "awsSecretKey"
	| "awsSessionToken"
	| "openAiApiKey"
	| "geminiApiKey"
	| "openAiNativeApiKey"
	| "deepSeekApiKey"
	| "mistralApiKey"
	| "unboundApiKey"
	| "requestyApiKey"

export type GlobalStateKey =
	| "apiProvider"
	| "apiModelId"
	| "glamaModelId"
	| "glamaModelInfo"
	| "awsRegion"
	| "awsUseCrossRegionInference"
	| "awsProfile"
	| "awsUseProfile"
	| "awsCustomArn"
	| "vertexKeyFile"
	| "vertexJsonCredentials"
	| "vertexProjectId"
	| "vertexRegion"
	| "lastShownAnnouncementId"
	| "customInstructions"
	| "alwaysAllowReadOnly"
	| "alwaysAllowWrite"
	| "alwaysAllowExecute"
	| "alwaysAllowBrowser"
	| "alwaysAllowMcp"
	| "alwaysAllowModeSwitch"
	| "alwaysAllowSubtasks"
	| "taskHistory"
	| "openAiBaseUrl"
	| "openAiModelId"
	| "openAiCustomModelInfo"
	| "openAiUseAzure"
	| "ollamaModelId"
	| "ollamaBaseUrl"
	| "lmStudioModelId"
	| "lmStudioBaseUrl"
	| "anthropicBaseUrl"
	| "modelMaxThinkingTokens"
	| "azureApiVersion"
	| "openAiStreamingEnabled"
	| "openRouterModelId"
	| "openRouterModelInfo"
	| "openRouterBaseUrl"
	| "openRouterSpecificProvider"
	| "openRouterUseMiddleOutTransform"
	| "googleGeminiBaseUrl"
	| "allowedCommands"
	| "ttsEnabled"
	| "ttsSpeed"
	| "soundEnabled"
	| "soundVolume"
	| "diffEnabled"
	| "enableCheckpoints"
	| "checkpointStorage"
	| "browserViewportSize"
	| "screenshotQuality"
	| "remoteBrowserHost"
	| "fuzzyMatchThreshold"
	| "writeDelayMs"
	| "terminalOutputLineLimit"
	| "terminalShellIntegrationTimeout"
	| "mcpEnabled"
	| "enableMcpServerCreation"
	| "alwaysApproveResubmit"
	| "requestDelaySeconds"
	| "rateLimitSeconds"
	| "currentApiConfigName"
	| "listApiConfigMeta"
	| "vsCodeLmModelSelector"
	| "mode"
	| "modeApiConfigs"
	| "customModePrompts"
	| "customSupportPrompts"
	| "enhancementApiConfigId"
	| "experiments" // Map of experiment IDs to their enabled state
	| "autoApprovalEnabled"
	| "enableCustomModeCreation" // Enable the ability for Roo to create custom modes
	| "customModes" // Array of custom modes
	| "unboundModelId"
	| "requestyModelId"
	| "requestyModelInfo"
	| "unboundModelInfo"
	| "modelTemperature"
	| "modelMaxTokens"
	| "mistralCodestralUrl"
	| "maxOpenTabsContext"
	| "maxWorkspaceFiles"
	| "browserToolEnabled"
	| "lmStudioSpeculativeDecodingEnabled"
	| "lmStudioDraftModelId"
	| "telemetrySetting"
	| "showRooIgnoredFiles"
	| "remoteBrowserEnabled"
	| "language"
	| "maxReadFileLine"
	| "fakeAi"

export type ConfigurationKey = GlobalStateKey | SecretKey

export type ConfigurationValues = Record<ConfigurationKey, any>
