import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../utils/logger';

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}

/**
 * 손상 방지 JSON 저장소.
 * - 쓰기는 임시 파일 작성 후 rename으로 원자적으로 수행
 * - 모든 변경은 내부 큐로 직렬화되어 동시 쓰기 경합이 없음
 * - 읽기 시 검증에 실패하면 손상 파일을 백업하고 기본값으로 복구
 */
export class JsonStore<T> {
  private cache: T | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly createDefaults: () => T,
    private readonly validate: (value: unknown) => value is T,
  ) {}

  async read(): Promise<T> {
    if (this.cache === null) {
      this.cache = await this.load();
    }
    return this.cache;
  }

  /** 변경 함수를 직렬화해 실행하고 저장한 뒤, 변경 함수의 반환값을 돌려준다. */
  async update<R>(mutate: (data: T) => R): Promise<R> {
    let result!: R;
    const run = this.queue.then(async () => {
      const data = await this.read();
      result = mutate(data);
      await this.persist(data);
    });
    this.queue = run.catch(() => undefined);
    await run;
    return result;
  }

  private async load(): Promise<T> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!this.validate(parsed)) {
        throw new Error('데이터 형식 검증 실패');
      }
      return parsed;
    } catch (error) {
      if (!isFileNotFound(error)) {
        logger.error(`JSON 손상 감지, 백업 후 기본값으로 복구합니다: ${this.filePath}`, error);
        await this.backupCorruptFile();
      }
      const defaults = this.createDefaults();
      await this.persist(defaults);
      return defaults;
    }
  }

  private async persist(data: T): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(tmpPath, this.filePath);
    this.cache = data;
  }

  private async backupCorruptFile(): Promise<void> {
    try {
      await rename(this.filePath, `${this.filePath}.corrupt-${Date.now()}`);
    } catch {
      // 원본 파일이 없으면 백업할 것도 없다.
    }
  }
}
