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
import {Component, OnInit} from '@angular/core';
import {FormControl} from "@angular/forms";
import {PlatformService} from "../../../services/platform.service";
import {DomainService} from "../../../services/domain.service";
import {ActivatedRoute} from "@angular/router";
import * as _ from 'lodash';
import {SnackbarService} from "../../../services/snackbar.service";
import {DialogService} from "../../../services/dialog.service";

@Component({
  selector: 'app-domain-settings-memberships',
  templateUrl: './memberships.component.html',
  styleUrls: ['./memberships.component.scss']
})
export class DomainSettingsMembershipsComponent implements OnInit {
  private domainRoleScope: string = 'DOMAIN';
  private domainId: string;
  userMembers: any[] = [];
  groupMembers: any[] = [];
  groups: any[];
  roles: any[];
  userCtrl = new FormControl();
  filteredUsers: any[];
  selectedUser: any;
  selectedGroup: any;
  selectedUserRole: any;
  selectedGroupRole: any;
  displayReset: boolean = false;

  constructor(private platformService: PlatformService,
              private domainService: DomainService,
              private dialogService: DialogService,
              private snackbarService: SnackbarService,
              private route: ActivatedRoute) {
    this.userCtrl.valueChanges
      .subscribe(searchTerm => {
        if (searchTerm && typeof searchTerm === 'string') {
          this.platformService.searchUsers(searchTerm + '*', 0, 30).subscribe(response => {
            this.filteredUsers = response.data;
          });
        }
      });
  }

  ngOnInit() {
    this.domainId = this.route.snapshot.parent.parent.params['domainId'];
    this.loadMembers(this.route.snapshot.data['members']);
    this.loadRoles();
    this.loadGroups();
  }

  onUserSelectionChanged(event) {
    this.selectedUser = event.option.value["id"];
    this.displayReset = true;
  }

  displayUserFn(user?: any): string | undefined {
    return user ? user.username : undefined;
  }

  displayUserName(user) {
    if (user.firstName) {
      return user.firstName + " " + (user.lastName ? user.lastName : '');
    } else {
      return user.username;
    }
  }

  addUserMembership(event) {
    event.preventDefault();
    this.domainService.addMember(this.domainId, this.selectedUser, 'USER', this.selectedUserRole).subscribe(response => {
      this.selectedUser = null;
      this.selectedUserRole = null;
      this.userCtrl.reset();
      this.reloadMembers();
      this.snackbarService.open("Member added");
    });

  }

  addGroupMembership(event) {
    event.preventDefault();
    this.domainService.addMember(this.domainId, this.selectedGroup, 'GROUP', this.selectedGroupRole).subscribe(response => {
      this.selectedGroup = null;
      this.selectedGroupRole = null;
      this.reloadMembers();
      this.snackbarService.open("Member added");
    });
  }

  avatarUrl(user) {
    return 'assets/material-letter-icons/' + user.name.charAt(0).toUpperCase() + '.svg';
  }

  delete(membershipId, event) {
    event.preventDefault();
    this.dialogService
      .confirm('Delete member', 'Are you sure you want to delete this member ?')
      .subscribe(res => {
        if (res) {
          this.domainService.removeMember(this.domainId, membershipId).subscribe(response => {
            this.snackbarService.open("Member deleted");
            this.reloadMembers();
          });
        }
      });
  }

  private reloadMembers() {
    this.domainService.members(this.domainId).subscribe(response => {
      this.loadMembers(response);
    })
  }

  private loadMembers(members) {
    let memberships = members.memberships;
    let metadata = members.metadata;
    this.userMembers = _.map(_.filter(memberships, {memberType: 'user'}), m => {
      m.name = (metadata['users'][m.memberId]) ? metadata['users'][m.memberId].displayName : 'Unknown user';
      m.roleName = (metadata['roles'][m.role]) ? metadata['roles'][m.role].name : 'Unknown role';
      return m;
    });
    this.groupMembers = _.map(_.filter(memberships, {memberType: 'group'}), m => {
      m.name = (metadata['groups'][m.memberId]) ? metadata['groups'][m.memberId].displayName : 'Unknown group';
      m.roleName = (metadata['roles'][m.role]) ? metadata['roles'][m.role].name : 'Unknown role';
      return m;
    });
  }

  private loadRoles() {
    this.platformService.roles(this.domainRoleScope).subscribe(response => {
      this.roles = response;
    });
  }

  private loadGroups() {
    this.platformService.groups().subscribe(response => {
      this.groups = response.data;
    });
  }
}
