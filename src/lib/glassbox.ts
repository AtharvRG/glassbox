import { supabase } from './supabase';

export type StepResult<T> = {
  output: T;
  reasoning?: string; // The "Why"
};

export class GlassBox {
  private executionId: string | null = null;
  private stepCount = 0;

  constructor(private name: string) {}

  /**
   * Starts a new tracking session in the database.
   */
  async start(metadata: Record<string, any> = {}) {
    try {
      const { data, error } = await supabase
        .from('executions')
        .insert({
          name: this.name,
          metadata,
          status: 'running',
        })
        .select()
        .single();

      if (error) throw error;
      this.executionId = data.id;
      return this.executionId;
    } catch (err) {
      console.error('GlassBox: Failed to start execution', err);
      // We don't throw here because we don't want to break the app if logging fails
      return null;
    }
  }

  /**
   * Wraps a unit of logic (a step) to capture its inputs, outputs, and reasoning.
   */
  async step<T>(
    stepName: string,
    logicFn: () => Promise<StepResult<T>>,
    inputData: any = {}
  ): Promise<T> {
    // If start() wasn't called or failed, just run the logic without logging
    if (!this.executionId) {
      const res = await logicFn();
      return res.output;
    }

    this.stepCount++;
    const currentStepOrder = this.stepCount;
    const startTime = Date.now();
    
    let status = 'success';
    let outputData: any = null;
    let reasoning = '';

    try {
      // Run the actual business logic
      const result = await logicFn();
      
      outputData = result.output;
      reasoning = result.reasoning || '';
      
      return result.output;

    } catch (err: any) {
      // Catch errors to log them, then re-throw
      status = 'failed';
      outputData = { error: err.message, stack: err.stack };
      reasoning = 'Step threw an exception';
      throw err;

    } finally {
      // Log the result to Supabase (Fire-and-forget for performance)
      const duration = Date.now() - startTime;
      
      // We don't await this because we don't want to slow down the user's request
      supabase.from('steps').insert({
        execution_id: this.executionId,
        step_name: stepName,
        step_order: currentStepOrder,
        input: inputData,
        output: outputData,
        reasoning: reasoning,
        status: status,
        duration_ms: duration,
      }).then(({ error }) => {
        if (error) console.error('GlassBox: Failed to log step', error);
      });
    }
  }

  /**
   * Marks the execution as finished.
   */
  async finish(status: 'completed' | 'failed' = 'completed') {
    if (!this.executionId) return;

    await supabase
      .from('executions')
      .update({ status })
      .eq('id', this.executionId);
  }
}