/**
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
package io.gravitee.am.management.handlers.management.api.resources;

import io.gravitee.am.management.service.UserService;
import io.gravitee.am.service.DomainService;
import io.gravitee.am.service.GroupService;
import io.gravitee.am.service.exception.*;
import io.gravitee.am.service.model.UpdateGroup;
import io.gravitee.common.http.MediaType;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;

import javax.ws.rs.DELETE;
import javax.ws.rs.POST;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.container.AsyncResponse;
import javax.ws.rs.container.Suspended;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Titouan COMPIEGNE (titouan.compiegne at graviteesource.com)
 * @author GraviteeSource Team
 */
public class GroupMemberResource extends AbstractResource {

    @Autowired
    private GroupService groupService;

    @Autowired
    private DomainService domainService;

    @Autowired
    private UserService userService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation(value = "Add a group member")
    @ApiResponses({
            @ApiResponse(code = 200, message = "Member has been added successfully"),
            @ApiResponse(code = 400, message = "User does not exist"),
            @ApiResponse(code = 500, message = "Internal server error")})
    public void addMember(
            @PathParam("domain") String domain,
            @PathParam("group") String group,
            @PathParam("member") String userId,
            @Suspended final AsyncResponse response) {
        final io.gravitee.am.identityprovider.api.User authenticatedUser = getAuthenticatedUser();

        domainService.findById(domain)
                .switchIfEmpty(Maybe.error(new DomainNotFoundException(domain)))
                .flatMap(__ -> groupService.findById(group))
                .switchIfEmpty(Maybe.error(new GroupNotFoundException(group)))
                .flatMapSingle(group1 -> userService.findById(userId)
                        .switchIfEmpty(Maybe.error(new UserNotFoundException(userId)))
                        .flatMapSingle(user -> {
                            if (group1.getMembers() != null && group1.getMembers().contains(userId)) {
                                return Single.error(new MemberAlreadyExistsException(userId));
                            }

                            List<String> groupMembers = group1.getMembers() != null ? new ArrayList(group1.getMembers()) : new ArrayList();
                            groupMembers.add(userId);

                            UpdateGroup updateGroup = new UpdateGroup();
                            updateGroup.setName(group1.getName());
                            updateGroup.setDescription(group1.getDescription());
                            updateGroup.setRoles(group1.getRoles());
                            updateGroup.setMembers(groupMembers);
                            return groupService.update(domain, group, updateGroup, authenticatedUser);
                        })
                )
                .map(group1 -> Response.ok(group1).build())
                .subscribe(
                        result -> response.resume(result),
                        error -> response.resume(error));

    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation(value = "Remove a group member")
    @ApiResponses({
            @ApiResponse(code = 200, message = "Member has been removed successfully"),
            @ApiResponse(code = 400, message = "User does not exist"),
            @ApiResponse(code = 500, message = "Internal server error")})
    public void removeMember(
            @PathParam("domain") String domain,
            @PathParam("group") String group,
            @PathParam("member") String userId,
            @Suspended final AsyncResponse response) {
        final io.gravitee.am.identityprovider.api.User authenticatedUser = getAuthenticatedUser();

        domainService.findById(domain)
                .switchIfEmpty(Maybe.error(new DomainNotFoundException(domain)))
                .flatMap(__ -> groupService.findById(group))
                .switchIfEmpty(Maybe.error(new GroupNotFoundException(group)))
                .flatMapSingle(group1 -> userService.findById(userId)
                        .switchIfEmpty(Maybe.error(new UserNotFoundException(userId)))
                        .flatMapSingle(user -> {
                            if (group1.getMembers() == null || !group1.getMembers().contains(userId)){
                                return Single.error(new MemberNotFoundException(userId));
                            }

                            List<String> groupMembers = group1.getMembers() != null ? new ArrayList(group1.getMembers()) : new ArrayList();
                            groupMembers.remove(userId);

                            UpdateGroup updateGroup = new UpdateGroup();
                            updateGroup.setName(group1.getName());
                            updateGroup.setDescription(group1.getDescription());
                            updateGroup.setRoles(group1.getRoles());
                            updateGroup.setMembers(groupMembers);
                            return groupService.update(domain, group, updateGroup, authenticatedUser);
                        })
                )
                .map(group1 -> Response.ok(group1).build())
                .subscribe(
                        result -> response.resume(result),
                        error -> response.resume(error));

    }
}
