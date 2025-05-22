import { PipeTransform } from '@nestjs/common';
import { trimRecursive } from '../utils/strings';

export class TrimWhitespacePipe implements PipeTransform {
  transform<T>(value: T) {
    return trimRecursive(value);
  }
}
