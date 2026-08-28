package com.ibizabroker.bibliotheque.entity;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
@Table(name = "Books")
public class Books {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer bookId;
    String bookName;
    String bookAuthor;
    String bookGenre;
    Integer noOfCopies;

    @Column(name = "book_code")
    private String bookCode;

    public void borrowBook() {
        this.noOfCopies--;
    }

    public void returnBook() {
        this.noOfCopies++;
    }

}
