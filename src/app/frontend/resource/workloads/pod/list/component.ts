// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component} from '@angular/core';
import {StateService} from '@uirouter/core';
import {Pod, PodList} from 'typings/backendapi';

import {ResourceListWithStatuses} from '../../../../common/resources/list';
import {NamespacedResourceListService} from '../../../../common/services/resource/resourcelist';

@Component({selector: 'kd-pod', templateUrl: './template.html'})
export class PodListComponent extends ResourceListWithStatuses<PodList, Pod> {
  constructor(state: StateService, podListService: NamespacedResourceListService<PodList>) {
    super('pod', state, podListService);
  }

  map(podList: PodList): Pod[] {
    return podList.pods;
  }

  isInErrorState(resource: Pod): boolean {
    return resource.podStatus.status === 'Failed';
  }

  isInWarningState(resource: Pod): boolean {
    return resource.podStatus.status === 'Pending';
  }

  isInSuccessState(resource: Pod): boolean {
    return resource.podStatus.status === 'Succeeded' || resource.podStatus.status === 'Running';
  }

  getDisplayColumns(): string[] {
    return ['status', 'name', 'node', 'statusname', 'restarts', 'age'];
  }

  /**
   * Returns a displayable status message for the pod.
   */
  getDisplayStatus(pod: Pod): string {
    // See kubectl printers.go for logic in kubectl.
    // https://github.com/kubernetes/kubernetes/blob/39857f486511bd8db81868185674e8b674b1aeb9/pkg/printers/internalversion/printers.go
    let msgState = 'running';
    let reason = undefined;

    // NOTE: Init container statuses are currently not taken into account.
    // However, init containers with errors will still show as failed because
    // of warnings.
    if (pod.podStatus.containerStates) {
      // Container states array may be null when no containers have
      // started yet.

      for (let i = pod.podStatus.containerStates.length - 1; i >= 0; i--) {
        const state = pod.podStatus.containerStates[i];

        if (state.waiting) {
          msgState = 'waiting';
          reason = state.waiting.reason;
        }
        if (state.terminated) {
          msgState = 'terminated';
          reason = state.terminated.reason;
          if (!reason) {
            if (state.terminated.signal) {
              reason = `Signal:${state.terminated.signal}`;
            } else {
              reason = `ExitCode:${state.terminated.exitCode}`;
            }
          }
        }
      }
    }

    if (msgState === 'waiting') {
      return `Waiting: ${reason}`;
    }

    if (msgState === 'terminated') {
      return `Terminated: ${reason}`;
    }

    return pod.podStatus.podPhase;
  }
}