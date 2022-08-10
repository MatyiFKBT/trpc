import { AnyRouter, Maybe, Procedure, inferRouterError } from '@trpc/server';
import { TRPCErrorResponse } from '@trpc/server/rpc';

type RouterOrProcedure = AnyRouter | Procedure<any>;

type inferErrorShape<TRouterOrProcedure extends AnyRouter | Procedure<any>> =
  TRouterOrProcedure extends AnyRouter
    ? inferRouterError<TRouterOrProcedure>
    : TRouterOrProcedure['_def']['_config']['errorShape'];

export interface TRPCClientErrorLike<
  TRouterOrProcedure extends RouterOrProcedure,
> {
  readonly message: string;
  readonly shape: Maybe<inferErrorShape<TRouterOrProcedure>>;
  readonly data: Maybe<inferErrorShape<TRouterOrProcedure>['data']>;
}

export class TRPCClientError<TRouterOrProcedure extends RouterOrProcedure>
  extends Error
  implements TRPCClientErrorLike<TRouterOrProcedure>
{
  public readonly cause;
  public readonly shape: Maybe<inferErrorShape<TRouterOrProcedure>>;
  public readonly data: Maybe<inferErrorShape<TRouterOrProcedure>['data']>;
  public readonly meta;

  constructor(
    message: string,
    opts?: {
      result?: Maybe<inferErrorShape<TRouterOrProcedure>>;
      cause?: Error;
      meta?: Record<string, unknown>;
    },
  ) {
    const cause = opts?.cause;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore https://github.com/tc39/proposal-error-cause
    super(message, { cause });

    this.meta = opts?.meta;

    this.cause = cause;
    this.shape = opts?.result?.error;
    this.data = opts?.result?.error.data;
    this.name = 'TRPCClientError';

    Object.setPrototypeOf(this, TRPCClientError.prototype);
  }

  public static from<TRouterOrProcedure extends RouterOrProcedure>(
    cause: Error | TRPCErrorResponse<any>,
    opts: { meta?: Record<string, unknown> } = {},
  ): TRPCClientError<TRouterOrProcedure> {
    if (!(cause instanceof Error)) {
      return new TRPCClientError<TRouterOrProcedure>(
        (cause.error as any).message ?? '',
        {
          ...opts,
          cause: undefined,
          result: cause as any,
        },
      );
    }
    if (cause.name === 'TRPCClientError') {
      return cause as TRPCClientError<any>;
    }

    return new TRPCClientError<TRouterOrProcedure>(cause.message, {
      ...opts,
      cause,
      result: null,
    });
  }
}
