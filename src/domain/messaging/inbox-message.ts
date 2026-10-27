export interface ReceiveInboxProps {
  messageId: string;
  consumerName: string;
  payloadHash: string;
  receivedAt?: Date;
}

export interface InboxMessageState extends ReceiveInboxProps {
  receivedAt: Date;
  processedAt?: Date;
}

export class InboxMessage {
  private constructor(
    public readonly messageId: string,
    public readonly consumerName: string,
    public readonly payloadHash: string,
    public readonly receivedAt: Date,
    private _processedAt?: Date,
  ) {}

  static receive(props: ReceiveInboxProps): InboxMessage {
    if (!props.messageId.trim() || !props.consumerName.trim() || !props.payloadHash.trim()) {
      throw new Error('Inbox message identifiers and payload hash are required');
    }

    return new InboxMessage(
      props.messageId,
      props.consumerName,
      props.payloadHash,
      props.receivedAt ?? new Date(),
    );
  }

  static rehydrate(state: InboxMessageState): InboxMessage {
    return new InboxMessage(
      state.messageId,
      state.consumerName,
      state.payloadHash,
      state.receivedAt,
      state.processedAt,
    );
  }

  get processedAt(): Date | undefined { return this._processedAt; }

  isProcessed(): boolean { return this._processedAt !== undefined; }

  markProcessed(at: Date): void {
    if (this.isProcessed()) throw new Error('Inbox message is already processed');
    this._processedAt = at;
  }
}