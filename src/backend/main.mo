import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  include MixinStorage();

  // Media entry type
  type MediaEntry = {
    id : Text;
    title : Text;
    mediaType : MediaType;
    timestamp : Int;
    file : Storage.ExternalBlob;
    group : Text;
  };

  module MediaEntry {
    public func compareByTimestampAsc(entry1 : MediaEntry, entry2 : MediaEntry) : Order.Order {
      Int.compare(entry1.timestamp, entry2.timestamp);
    };
  };

  type MediaType = {
    #photo;
    #video;
  };

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  // Store file references
  let mediaEntries = Map.empty<Text, MediaEntry>();

  // Store user profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Access control integration
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Self-register as admin if no admin exists yet
  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    if (accessControlState.adminAssigned) {
      return false;
    };
    if (caller.isAnonymous()) {
      return false;
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    true;
  };

  // Check if any admin has been assigned
  public query func isAdminClaimed() : async Bool {
    accessControlState.adminAssigned;
  };

  // Reset admin — clears all admin state so next login becomes admin
  public shared ({ caller }) func resetAdmin() : async () {
    // Allow reset if no admin is assigned, or if caller is current admin
    if (accessControlState.adminAssigned and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the current admin can reset admin state");
    };
    accessControlState.userRoles.clear();
    accessControlState.adminAssigned := false;
  };

  // User Profile Functions

  // Get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access profiles");
    };
    userProfiles.get(caller);
  };

  // Get any user's profile (own profile or admin can view others)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Save caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Media Functions

  // List all media entries (public - no auth required)
  public query ({ caller }) func listMedia() : async [MediaEntry] {
    mediaEntries.values().toArray().sort(MediaEntry.compareByTimestampAsc);
  };

  // Admin: Add media entry
  public shared ({ caller }) func addMedia(
    title : Text,
    mediaType : MediaType,
    file : Storage.ExternalBlob,
    group : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add media");
    };

    let id = title.concat(Time.now().toText());
    let mediaEntry : MediaEntry = {
      id;
      title;
      mediaType;
      timestamp = Time.now();
      file;
      group;
    };

    mediaEntries.add(id, mediaEntry);
    id;
  };

  // Admin: Delete media entry
  public shared ({ caller }) func deleteMedia(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete media");
    };

    if (not mediaEntries.containsKey(id)) {
      Runtime.trap("Media entry not found");
    };

    mediaEntries.remove(id);
  };

  // Get specific media entry (public - no auth required)
  public query ({ caller }) func getMedia(id : Text) : async MediaEntry {
    switch (mediaEntries.get(id)) {
      case (null) { Runtime.trap("Media entry not found") };
      case (?mediaEntry) { mediaEntry };
    };
  };
};
