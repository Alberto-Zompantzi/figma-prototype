export type ProcessingSourceContext =
  | {
      kind: 'file';
      file: File;
      fileName: string;
      mimeType: string;
    }
  | {
      kind: 'text';
      text: string;
    };

let currentSource:
  | {
      scenarioKey: string;
      source: ProcessingSourceContext;
    }
  | null = null;

export function setProcessingSourceContext(
  scenarioKey: string,
  source: ProcessingSourceContext,
) {
  currentSource = { scenarioKey, source };
}

export function getProcessingSourceContext(scenarioKey: string) {
  return currentSource?.scenarioKey === scenarioKey ? currentSource.source : null;
}
