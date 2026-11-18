package com.kpah.server.world;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "player_characters")
public class PlayerCharacter {
    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "map_id", nullable = false, length = 80)
    private String mapId;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    @Column(nullable = false)
    private int hp;

    @Column(nullable = false)
    private int experience;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "character_inventory", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "item_code", length = 120)
    @Column(name = "quantity", nullable = false)
    private Map<String, Integer> inventory = new HashMap<>();

    protected PlayerCharacter() {
    }

    public static PlayerCharacter from(String id, PlayerMotionState state, int hp,
                                       int experience, Map<String, Integer> inventory) {
        PlayerCharacter character = new PlayerCharacter();
        character.id = id;
        character.mapId = state.mapId();
        character.x = state.x();
        character.y = state.y();
        character.hp = Math.max(0, hp);
        character.experience = Math.max(0, experience);
        character.inventory.putAll(inventory);
        return character;
    }

    public String getId() { return id; }
    public String getMapId() { return mapId; }
    public double getX() { return x; }
    public double getY() { return y; }
    public int getHp() { return hp; }
    public int getExperience() { return experience; }
    public Map<String, Integer> getInventory() { return Map.copyOf(inventory); }
}
