package com.example.template.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.action.index.IndexRequest;
import org.opensearch.action.search.SearchRequest;
import org.opensearch.action.search.SearchResponse;
import org.opensearch.client.RequestOptions;
import org.opensearch.client.RestHighLevelClient;
import org.opensearch.index.query.QueryBuilders;
import org.opensearch.search.builder.SearchSourceBuilder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateSearchService {

    private static final String INDEX = "template-items";
    private final RestHighLevelClient client;
    private final ObjectMapper objectMapper;

    public void index(TemplateDocument doc) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> source = objectMapper.convertValue(doc, Map.class);
            IndexRequest request = new IndexRequest(INDEX).id(doc.getId()).source(source);
            client.index(request, RequestOptions.DEFAULT);
        } catch (IOException e) {
            log.error("Failed to index template document id={}", doc.getId(), e);
        }
    }

    public List<TemplateDocument> searchByName(String name) {
        List<TemplateDocument> results = new ArrayList<>();
        try {
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder()
                    .query(QueryBuilders.matchQuery("name", name));
            SearchRequest request = new SearchRequest(INDEX).source(sourceBuilder);
            SearchResponse response = client.search(request, RequestOptions.DEFAULT);
            for (var hit : response.getHits().getHits()) {
                results.add(objectMapper.convertValue(hit.getSourceAsMap(), TemplateDocument.class));
            }
        } catch (IOException e) {
            log.error("Failed to search template documents name={}", name, e);
        }
        return results;
    }
}
