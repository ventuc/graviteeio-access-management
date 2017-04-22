/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit } from '@angular/core';
import { DomainService } from "../../services/domain.service";
import { SnackbarService } from "../../services/snackbar.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-creation',
  templateUrl: 'domain-creation.component.html',
  styleUrls: ['domain-creation.component.scss']
})
export class DomainCreationComponent implements OnInit {
  domain: any = {};

  constructor(private domainService: DomainService, private snackbarService: SnackbarService, private router: Router) { }

  ngOnInit() {
  }

  create() {
    this.domainService.create(this.domain).map(res => res.json()).subscribe(data => {
      this.snackbarService.open("Domain " + data.name + " created");
      this.router.navigate(['/domains', data.id])
    });
  }
}
