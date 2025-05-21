import { PipeTransform } from '@nestjs/common';
import { trimRecursive } from '../utils';

export class TrimWhitespacePipe implements PipeTransform {
  transform<T>(value: T) {
    return trimRecursive(value);
  }
}
