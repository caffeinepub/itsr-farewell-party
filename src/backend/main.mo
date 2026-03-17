import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
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

  // User profile type (kept for stable variable compatibility)
  public type UserProfile = {
    name : Text;
  };

  // Stable storage for media entries -- persists across upgrades
  stable var stableMediaEntries : [(Text, MediaEntry)] = [];

  // Runtime map -- rebuilt from stable storage on each upgrade
  let mediaEntries = Map.empty<Text, MediaEntry>();

  // Restore entries from stable storage on upgrade
  system func postupgrade() {
    for ((k, v) in stableMediaEntries.vals()) {
      mediaEntries.add(k, v);
    };
  };

  // Save entries to stable storage before upgrade
  system func preupgrade() {
    stableMediaEntries := mediaEntries.entries().toArray();
  };

  // Keep stable variables from previous version to avoid upgrade compatibility errors
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Media Functions

  // List all media entries (public)
  public query func listMedia() : async [MediaEntry] {
    mediaEntries.values().toArray().sort(MediaEntry.compareByTimestampAsc);
  };

  // Add media entry (no auth required - protected by frontend password gate)
  public shared func addMedia(
    title : Text,
    mediaType : MediaType,
    file : Storage.ExternalBlob,
    group : Text,
  ) : async Text {
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

  // Delete media entry (no auth required - protected by frontend password gate)
  public shared func deleteMedia(id : Text) : async () {
    if (not mediaEntries.containsKey(id)) {
      Runtime.trap("Media entry not found");
    };
    mediaEntries.remove(id);
  };

  // Get specific media entry (public)
  public query func getMedia(id : Text) : async MediaEntry {
    switch (mediaEntries.get(id)) {
      case (null) { Runtime.trap("Media entry not found") };
      case (?mediaEntry) { mediaEntry };
    };
  };
};
