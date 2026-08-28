package com.ibizabroker.bibliotheque.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.persistence.*;
import java.util.Set;

@Data
@Entity
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer userId;
    private String username;
    private String name;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(name = "user_code")
    private String userCode;
    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinTable(name = "USER_ROLE",
            joinColumns = {
                    @JoinColumn(name = "USER_ID")
            },
            inverseJoinColumns = {
                    @JoinColumn(name = "ROLE_ID")
            }
    )
    private Set<Role> role;

}

